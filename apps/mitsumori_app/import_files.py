from __future__ import annotations

import csv
import math
import re
import sys
from pathlib import Path

import pandas as pd
import pdfplumber


TRADES = [
    ("仮設工事", ["仮設", "足場", "外部足場", "内部足場", "枠組足場", "単管足場", "組立解体", "組立", "解体", "養生", "清掃", "墨出", "水盛", "シート", "メッシュシート", "安全", "現場管理", "仮囲い", "昇降", "先行手摺"]),
    ("土工事", ["土工", "掘削", "埋戻", "残土", "砕石", "転圧", "床付", "根切", "整地"]),
    ("鉄筋工事", ["鉄筋", "D10", "D13", "D16", "D19", "配筋", "メッシュ", "ワイヤーメッシュ"]),
    ("コンクリート工事", ["コンクリート", "生コン", "打設", "均し", "土間", "基礎", "スラブ", "Fc", "m3", "㎥"]),
    ("型枠工事", ["型枠", "型わく", "せき板", "フォーム", "支保", "脱型"]),
    ("左官工事", ["左官", "モルタル", "塗り", "金鏝", "刷毛", "補修", "下地調整"]),
    ("金属工事", ["金属", "アルミ", "ステン", "スチール", "手摺", "笠木", "金物", "アンカー", "鉄骨"]),
]

TRADES.extend([
    ("防水工事", ["防水", "ウレタン", "FRP", "シート防水", "塗膜防水", "コーキング", "シーリング", "止水"]),
    ("塗装工事", ["塗装", "塗替", "下塗", "中塗", "上塗", "錆止", "吹付", "ローラー"]),
    ("木工事", ["木工", "大工", "造作", "下地", "合板", "間柱", "根太", "胴縁"]),
    ("屋根工事", ["屋根", "瓦", "ルーフィング", "棟", "軒", "雨樋"]),
    ("板金工事", ["板金", "水切", "笠木", "谷樋", "ガルバ", "折板"]),
    ("建具工事", ["建具", "サッシ", "ドア", "窓", "網戸", "シャッター"]),
    ("ガラス工事", ["ガラス", "硝子", "ペアガラス", "鏡"]),
    ("内装工事", ["内装", "クロス", "壁紙", "床", "CF", "フロア", "ボード", "天井"]),
    ("タイル工事", ["タイル", "磁器", "目地"]),
    ("石工事", ["石", "御影", "大理石"]),
    ("電気工事", ["電気", "配線", "照明", "分電盤", "コンセント", "スイッチ"]),
    ("給排水衛生工事", ["給排水", "衛生", "給水", "排水", "便器", "洗面", "水栓", "配管"]),
    ("空調換気工事", ["空調", "換気", "エアコン", "ダクト", "換気扇"]),
    ("外構工事", ["外構", "舗装", "フェンス", "門扉", "ブロック", "土間", "植栽"]),
    ("解体工事", ["解体", "撤去", "はつり", "斫り", "処分"]),
    ("雑工事", ["雑工", "雑", "補修", "クリーニング", "清掃"]),
])

UNITS = {"式", "m2", "㎡", "m3", "㎥", "m", "枚", "本", "kg", "t", "箇所", "ヶ所", "個", "台", "人工", "日", "回"}


def choose_file() -> Path | None:
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        selected = filedialog.askopenfilename(
            title="取り込むPDF・Excel・CSVを選択",
            filetypes=[
                ("見積ファイル", "*.pdf *.xlsx *.xlsm *.csv *.tsv"),
                ("PDF", "*.pdf"),
                ("Excel", "*.xlsx *.xlsm"),
                ("CSV", "*.csv *.tsv"),
                ("すべて", "*.*"),
            ],
        )
        root.destroy()
        return Path(selected) if selected else None
    except Exception:
        return None


def clean_cell(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    text = str(value).strip()
    if text.endswith(".0") and text[:-2].replace("-", "").isdigit():
        text = text[:-2]
    return text


def read_pdf(path: Path) -> list[str]:
    lines: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
            lines.extend(line.strip() for line in text.splitlines() if line.strip())
    return lines


def read_spreadsheet(path: Path) -> list[str]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        sheets = {"CSV": pd.read_csv(path, header=None)}
    elif suffix == ".tsv":
        sheets = {"TSV": pd.read_csv(path, header=None, sep="\t")}
    else:
        sheets = pd.read_excel(path, sheet_name=None, header=None)

    lines: list[str] = []
    for sheet_name, df in sheets.items():
        for _, row in df.iterrows():
            cells = [clean_cell(value) for value in row.tolist()]
            cells = [cell for cell in cells if cell]
            if cells:
                lines.append(" ".join(cells))
    return lines


def classify_trade(text: str) -> str:
    lower = text.lower()
    for trade, keys in TRADES:
        if any(key.lower() in lower for key in keys):
            return trade
    return "未分類"


def to_number(text: str) -> float | None:
    cleaned = text.replace(",", "").replace("¥", "").replace("￥", "")
    if re.fullmatch(r"-?\d+(?:\.\d+)?", cleaned):
        return float(cleaned)
    return None


def fmt_number(value: float) -> str:
    if value.is_integer():
        return str(int(value))
    return f"{value:g}"


def parse_line(line: str) -> dict[str, str] | None:
    parts = [part for part in re.split(r"\s+", line.replace(",", "")) if part]
    if not parts:
        return None

    unit_index = next((i for i, part in enumerate(parts) if part in UNITS), -1)
    qty = 1.0
    unit = "式"
    price = 0.0
    name_parts = parts
    summary_parts: list[str] = []

    if unit_index > 0 and (qty_value := to_number(parts[unit_index - 1])) is not None:
        qty = qty_value
        unit = parts[unit_index]
        trailing = parts[unit_index + 1 :]
        price_index = next((i for i, part in enumerate(trailing) if to_number(part) is not None), -1)
        if price_index >= 0:
            price = to_number(trailing[price_index]) or 0.0
            summary_parts = trailing[:price_index] + trailing[price_index + 1 :]
        else:
            summary_parts = trailing
        name_parts = parts[: unit_index - 1]
    else:
        number_positions = [(i, to_number(part)) for i, part in enumerate(parts)]
        number_positions = [(i, value) for i, value in number_positions if value is not None]
        if len(number_positions) >= 2:
            qty = number_positions[-2][1] or 1.0
            price = number_positions[-1][1] or 0.0
            name_parts = parts[: number_positions[-2][0]]
        elif len(number_positions) == 1:
            price = number_positions[0][1] or 0.0
            name_parts = parts[: number_positions[0][0]]

    name = " ".join(name_parts).strip()
    if not name or len(name) <= 1:
        return None

    return {
        "trade": classify_trade(line),
        "name": name,
        "summary": " ".join(summary_parts).strip(),
        "qty": fmt_number(qty),
        "unit": unit,
        "price": fmt_number(price),
        "source": line,
    }


def main() -> int:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else choose_file()
    if not path:
        print("ファイルが選択されませんでした。")
        return 1
    if not path.exists():
        print(f"ファイルが見つかりません: {path}")
        return 1

    if path.suffix.lower() == ".pdf":
        lines = read_pdf(path)
    elif path.suffix.lower() in {".xlsx", ".xlsm", ".csv", ".tsv"}:
        lines = read_spreadsheet(path)
    else:
        print("対応形式は PDF / Excel(.xlsx, .xlsm) / CSV / TSV です。")
        return 1

    rows = [row for line in lines if (row := parse_line(line))]
    out_dir = Path(__file__).resolve().parent
    txt_path = out_dir / "取り込み用テキスト.txt"
    csv_path = out_dir / "取り込み結果.csv"

    txt_lines = [
        f"{row['trade']} {row['name']} {row['summary']} {row['qty']} {row['unit']} {row['price']}".strip()
        for row in rows
    ]
    txt_path.write_text("\n".join(txt_lines), encoding="utf-8-sig")

    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["trade", "name", "summary", "qty", "unit", "price", "source"])
        writer.writeheader()
        writer.writerows(rows)

    counts: dict[str, int] = {}
    for row in rows:
        counts[row["trade"]] = counts.get(row["trade"], 0) + 1

    print(f"読み取り元: {path}")
    print(f"取り込み候補: {len(rows)}件")
    print(" / ".join(f"{name}:{count}" for name, count in counts.items()))
    print(f"作成: {txt_path}")
    print(f"作成: {csv_path}")
    try:
        input("完了しました。Enterで閉じます。")
    except EOFError:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
