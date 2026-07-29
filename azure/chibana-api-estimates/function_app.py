import json
import os
from hashlib import sha256
from typing import Any

import azure.functions as func
import psycopg
from psycopg.rows import dict_row

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


def _connection_string() -> str:
    value = os.environ.get("POSTGRES_CONNECTION_STRING") or os.environ.get("DATABASE_URL")
    if not value:
        raise RuntimeError("POSTGRES_CONNECTION_STRING または DATABASE_URL が未設定です。")
    return value


def _connect():
    return psycopg.connect(_connection_string(), row_factory=dict_row)


def _json_response(payload: Any, status_code: int = 200) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(payload, ensure_ascii=False, default=str),
        status_code=status_code,
        mimetype="application/json",
        charset="utf-8",
    )


def _revision(payload: Any) -> str:
    normalized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256(normalized.encode("utf-8")).hexdigest()


def _ensure_schema() -> None:
    schema = """
    CREATE TABLE IF NOT EXISTS mitsumori_state (
      singleton_id smallint PRIMARY KEY CHECK (singleton_id = 1),
      payload jsonb NOT NULL,
      revision text NOT NULL,
      source_name text NOT NULL DEFAULT 'azure-functions',
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS mitsumori_state_history (
      history_id bigserial PRIMARY KEY,
      payload jsonb NOT NULL,
      revision text NOT NULL,
      source_name text NOT NULL,
      saved_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS mitsumori_state_history_saved_at_idx
      ON mitsumori_state_history (saved_at DESC);
    """
    with _connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(schema)
        connection.commit()


@app.route(route="estimates/health", methods=["GET"])
def estimates_health(req: func.HttpRequest) -> func.HttpResponse:
    try:
        _ensure_schema()
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT revision, updated_at FROM mitsumori_state WHERE singleton_id = 1")
                row = cursor.fetchone()
        return _json_response({"ok": True, "stored": bool(row), "state": row})
    except Exception as error:
        return _json_response({"ok": False, "error": str(error)}, 500)


@app.route(route="estimates/state", methods=["GET"])
def get_estimate_state(req: func.HttpRequest) -> func.HttpResponse:
    try:
        _ensure_schema()
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT payload, revision, source_name, updated_at FROM mitsumori_state WHERE singleton_id = 1"
                )
                row = cursor.fetchone()
        if not row:
            return _json_response({"exists": False, "payload": None})
        return _json_response({"exists": True, **row})
    except Exception as error:
        return _json_response({"error": str(error)}, 500)


@app.route(route="estimates/state", methods=["PUT", "POST"])
def save_estimate_state(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
        payload = body.get("payload", body)
        source_name = str(body.get("sourceName", "estimate-web"))[:100]
        revision = _revision(payload)
        _ensure_schema()

        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO mitsumori_state_history (payload, revision, source_name) VALUES (%s::jsonb, %s, %s)",
                    (json.dumps(payload, ensure_ascii=False), revision, source_name),
                )
                cursor.execute(
                    """
                    INSERT INTO mitsumori_state (singleton_id, payload, revision, source_name, updated_at)
                    VALUES (1, %s::jsonb, %s, %s, now())
                    ON CONFLICT (singleton_id) DO UPDATE SET
                      payload = EXCLUDED.payload,
                      revision = EXCLUDED.revision,
                      source_name = EXCLUDED.source_name,
                      updated_at = now()
                    RETURNING revision, source_name, updated_at
                    """,
                    (json.dumps(payload, ensure_ascii=False), revision, source_name),
                )
                saved = cursor.fetchone()
            connection.commit()
        return _json_response({"ok": True, **saved})
    except ValueError:
        return _json_response({"error": "JSON形式が正しくありません。"}, 400)
    except Exception as error:
        return _json_response({"error": str(error)}, 500)


@app.route(route="estimates/history", methods=["GET"])
def estimate_history(req: func.HttpRequest) -> func.HttpResponse:
    try:
        limit = min(max(int(req.params.get("limit", "20")), 1), 100)
        _ensure_schema()
        with _connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT history_id, revision, source_name, saved_at
                    FROM mitsumori_state_history
                    ORDER BY saved_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()
        return _json_response({"items": rows})
    except Exception as error:
        return _json_response({"error": str(error)}, 500)
