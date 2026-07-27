import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

postgres_bin = Path(os.environ.get("POSTGRES_BIN", r"C:\Program Files\PostgreSQL\18\bin"))
if os.name == "nt" and postgres_bin.exists():
    os.add_dll_directory(str(postgres_bin))

import psycopg
from flask import Flask, Response, jsonify, request, send_file, send_from_directory
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


NATIVE_DIR = Path(__file__).resolve().parent
APP_DIR = NATIVE_DIR.parents[1]
SCHEMA_PATH = NATIVE_DIR.parent / "database" / "001_schema.sql"
CONFIG_PATH = Path(
    os.environ.get(
        "MITSUMORI_DB_CONFIG",
        str(Path(os.environ.get("LOCALAPPDATA", Path.home())) / "MitsumoriPostgres" / "connection.json"),
    )
)
PRINT_DIR = Path(
    os.environ.get(
        "MITSUMORI_PRINT_DIR",
        str(Path(os.environ.get("USERPROFILE", Path.home())) / "Documents" / "MitsumoriPrints"),
    )
)
DROPBOX_DATA_PATH = Path(
    os.environ.get(
        "MITSUMORI_DROPBOX_DATA",
        str(APP_DIR.parents[2] / "mitsumori_data.json"),
    )
)

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024


def load_config():
    if not CONFIG_PATH.exists():
        raise RuntimeError("PostgreSQL接続設定がありません。setup-native-windows.ps1を先に実行してください。")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def connect():
    return psycopg.connect(**load_config(), row_factory=dict_row)


def normalize_payload(value):
    if isinstance(value, str):
        payload = json.loads(value)
    else:
        payload = value
    book = payload.get("book", payload)
    estimates = book.get("estimates")
    if not isinstance(estimates, list) or not estimates:
        raise ValueError("estimate data not found")
    content = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    return payload, content, len(estimates), book.get("activeId", "")


def revision_of(content):
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def timestamp_value(value):
    if not value:
        return 0
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except (TypeError, ValueError):
        return 0


def payload_freshness(payload):
    book = payload.get("book", payload)
    freshness = timestamp_value(payload.get("savedAt"))
    for record in book.get("estimates", []):
        freshness = max(
            freshness,
            timestamp_value(record.get("updatedAt")),
            timestamp_value(record.get("createdAt")),
        )
    return freshness


def read_dropbox_state():
    if not DROPBOX_DATA_PATH.exists():
        return None
    payload, content, estimate_count, active_id = normalize_payload(
        DROPBOX_DATA_PATH.read_text(encoding="utf-8-sig")
    )
    return {
        "payload": payload,
        "content": content,
        "revision": revision_of(content),
        "estimate_count": estimate_count,
        "active_id": active_id,
        "freshness": max(payload_freshness(payload), DROPBOX_DATA_PATH.stat().st_mtime),
    }


def write_dropbox_state(content):
    DROPBOX_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DROPBOX_DATA_PATH.exists():
        try:
            previous = DROPBOX_DATA_PATH.read_text(encoding="utf-8-sig")
            normalize_payload(previous)
            DROPBOX_DATA_PATH.with_name(f"{DROPBOX_DATA_PATH.name}.last-good").write_text(
                previous,
                encoding="utf-8",
            )
        except (OSError, ValueError, json.JSONDecodeError):
            pass
    temporary_path = DROPBOX_DATA_PATH.with_name(
        f"{DROPBOX_DATA_PATH.name}.tmp-{os.getpid()}"
    )
    temporary_path.write_text(content, encoding="utf-8")
    normalize_payload(temporary_path.read_text(encoding="utf-8"))
    os.replace(temporary_path, DROPBOX_DATA_PATH)


def ensure_schema():
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with connect() as connection:
        connection.execute(schema)


def read_stored_state(connection=None):
    owns_connection = connection is None
    current_connection = connection or connect()
    try:
        row = current_connection.execute(
            """
            SELECT payload, revision, source_name, updated_at
              FROM mitsumori_state
             WHERE singleton_id = 1
            """
        ).fetchone()
        if not row:
            return None
        _, content, estimate_count, active_id = normalize_payload(row["payload"])
        canonical_revision = revision_of(content)
        if row["revision"] != canonical_revision:
            current_connection.execute(
                """
                UPDATE mitsumori_state
                   SET revision = %s
                 WHERE singleton_id = 1
                   AND revision = %s
                """,
                (canonical_revision, row["revision"]),
            )
            current_connection.commit()
            row["revision"] = canonical_revision
        return {
            **row,
            "content": content,
            "estimate_count": estimate_count,
            "active_id": active_id,
        }
    finally:
        if owns_connection:
            current_connection.close()


def replace_stored_state(value, source_name, requested_revision=None):
    payload, content, estimate_count, active_id = normalize_payload(value)
    revision = revision_of(content)
    with connect() as connection:
        current = connection.execute(
            """
            SELECT payload, revision, source_name
              FROM mitsumori_state
             WHERE singleton_id = 1
             FOR UPDATE
            """
        ).fetchone()
        if requested_revision is not None and current and requested_revision != current["revision"]:
            connection.rollback()
            return {"conflict": True, "revision": current["revision"]}
        if current and current["revision"] != revision:
            connection.execute(
                """
                INSERT INTO mitsumori_state_history(payload, revision, source_name)
                VALUES (%s, %s, %s)
                """,
                (Jsonb(current["payload"]), current["revision"], current["source_name"]),
            )
        connection.execute(
            """
            INSERT INTO mitsumori_state(singleton_id, payload, revision, source_name, updated_at)
            VALUES (1, %s, %s, %s, now())
            ON CONFLICT (singleton_id) DO UPDATE SET
              payload = excluded.payload,
              revision = excluded.revision,
              source_name = excluded.source_name,
              updated_at = now()
            """,
            (Jsonb(payload), revision, source_name),
        )
    return {
        "conflict": False,
        "revision": revision,
        "estimate_count": estimate_count,
        "active_id": active_id,
    }


def reconcile_dropbox_state():
    stored = read_stored_state()
    try:
        dropbox = read_dropbox_state()
    except (OSError, ValueError, json.JSONDecodeError):
        dropbox = None

    if not stored and dropbox:
        replace_stored_state(dropbox["payload"], "dropbox-sync")
        return read_stored_state()
    if stored and not dropbox:
        write_dropbox_state(stored["content"])
        return stored
    if not stored or not dropbox or stored["revision"] == dropbox["revision"]:
        return stored

    stored_freshness = max(
        payload_freshness(stored["payload"]),
        stored["updated_at"].timestamp(),
    )
    if dropbox["freshness"] > stored_freshness:
        replace_stored_state(dropbox["payload"], "dropbox-sync")
        return read_stored_state()

    write_dropbox_state(stored["content"])
    return stored


def safe_print_name(value):
    try:
        from urllib.parse import unquote

        value = unquote(value or "")
    except ValueError:
        value = value or ""
    value = Path(value).stem
    value = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", value).strip()
    return value[:80] or "estimate"


@app.get("/api/health")
def health():
    with connect() as connection:
        connection.execute("SELECT 1")
        stored = read_stored_state(connection)
    return jsonify(
        ok=True,
        storage="PostgreSQL + Dropbox",
        dataReady=bool(stored),
        estimateCount=stored["estimate_count"] if stored else 0,
        updatedAt=stored["updated_at"].isoformat() if stored else None,
        dropboxData=str(DROPBOX_DATA_PATH),
    )


@app.get("/api/latest-data")
def latest_data():
    stored = reconcile_dropbox_state()
    if not stored:
        return Response("latest data not found", status=404, content_type="text/plain; charset=utf-8")
    response = Response(stored["content"], content_type="application/json; charset=utf-8")
    response.headers["X-Mitsumori-Data-Revision"] = stored["revision"]
    response.headers["X-Mitsumori-Data-Source-Count"] = "1"
    response.headers["X-Mitsumori-Data-Source"] = "PostgreSQL + Dropbox"
    response.headers["X-Mitsumori-Storage"] = "PostgreSQL + Dropbox"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.post("/api/save-data")
def save_data():
    reconcile_dropbox_state()
    result = replace_stored_state(
        request.get_data(as_text=True),
        "estimate-app",
        request.headers.get("X-Mitsumori-Data-Revision", ""),
    )
    if result["conflict"]:
        response = jsonify(
            ok=False,
            code="dropbox_data_conflict",
            message="他のPCで更新された見積りデータがあります。保存済みデータを読み込んで確認してください。",
            revision=result["revision"],
        )
        response.status_code = 409
        response.headers["X-Mitsumori-Data-Revision"] = result["revision"]
        return response
    stored = read_stored_state()
    write_dropbox_state(stored["content"])
    response = jsonify(
        ok=True,
        fileName="PostgreSQL + Dropbox",
        savedAt=datetime.now(timezone.utc).isoformat(),
        revision=result["revision"],
    )
    response.headers["X-Mitsumori-Data-Revision"] = result["revision"]
    response.headers["X-Mitsumori-Storage"] = "PostgreSQL + Dropbox"
    return response


@app.post("/api/import")
def import_data():
    result = replace_stored_state(request.get_data(as_text=True), "handoff-import")
    stored = read_stored_state()
    write_dropbox_state(stored["content"])
    return (
        jsonify(
            ok=True,
            estimateCount=result["estimate_count"],
            activeId=result["active_id"],
            revision=result["revision"],
        ),
        201,
    )


@app.get("/api/export")
def export_data():
    stored = read_stored_state()
    if not stored:
        return Response("data not found", status=404)
    response = Response(stored["content"], content_type="application/json; charset=utf-8")
    response.headers["Content-Disposition"] = (
        f'attachment; filename="mitsumori-postgres-{datetime.now():%Y-%m-%d}.json"'
    )
    return response


@app.post("/api/open-print-pdf")
def open_print_pdf():
    content = request.get_data()
    if not content.startswith(b"%PDF-"):
        return Response("invalid PDF data", status=400)
    PRINT_DIR.mkdir(parents=True, exist_ok=True)
    file_name = (
        f"{safe_print_name(request.headers.get('X-Mitsumori-Print-Name'))}"
        f"-{datetime.now():%Y%m%d-%H%M%S}.pdf"
    )
    (PRINT_DIR / file_name).write_bytes(content)
    return jsonify(ok=True, fileName=file_name, url=f"/api/prints/{file_name}")


@app.get("/api/prints/<path:file_name>")
def print_file(file_name):
    target = (PRINT_DIR / Path(file_name).name).resolve()
    if target.parent != PRINT_DIR.resolve() or not target.exists():
        return Response("not found", status=404)
    return send_file(target, mimetype="application/pdf", as_attachment=False)


@app.get("/")
def index():
    return send_from_directory(APP_DIR, "index.html")


@app.get("/<path:file_path>")
def static_file(file_path):
    return send_from_directory(APP_DIR, file_path)


def import_file(file_path):
    ensure_schema()
    source_payload, source_content, _, _ = normalize_payload(
        Path(file_path).read_text(encoding="utf-8-sig")
    )
    stored = read_stored_state()
    if stored and payload_freshness(stored["payload"]) >= payload_freshness(source_payload):
        write_dropbox_state(stored["content"])
        result = {
            "conflict": False,
            "revision": stored["revision"],
            "estimate_count": stored["estimate_count"],
            "active_id": stored["active_id"],
            "skipped": True,
        }
    else:
        result = replace_stored_state(source_content, "handoff-initial-data")
        stored = read_stored_state()
        write_dropbox_state(stored["content"])
    print(json.dumps(result, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--import", dest="import_path")
    parser.add_argument("--port", type=int, default=8766)
    arguments = parser.parse_args()
    if arguments.import_path:
        import_file(arguments.import_path)
        return
    ensure_schema()
    app.run(host="127.0.0.1", port=arguments.port, threaded=True, use_reloader=False)


if __name__ == "__main__":
    main()
