import datetime as dt
import html
import json
import os
from pathlib import Path

from openai import OpenAI


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
TAX_RATE = 0.10


def yen(amount):
    return f"{round(float(amount)):,}円"


def read_request_text():
    print("見積内容をまとめて貼ってください。")
    print("入力が終わったら、空行だけを入力してEnterを押してください。\n")
    lines = []
    while True:
        line = input()
        if not line.strip():
            break
        lines.append(line)
    return "\n".join(lines).strip()


def extract_estimate(request_text):
    today = dt.date.today()
    client = OpenAI()
    prompt = f"""
あなたは日本の見積書作成担当者です。
以下の文章から見積書データを抽出してください。
金額・数量は推測しすぎず、書かれていない項目は自然な初期値にしてください。

必ずJSONだけで返してください。
形式:
{{
  "quote_no": "Q-{today:%Y%m%d}-001",
  "issue_date": "{today}",
  "seller_name": "自社名。不明なら空文字",
  "client_name": "宛先。不明なら空文字",
  "subject": "件名",
  "overview": "概要を1〜2文",
  "payment_terms": "支払条件",
  "valid_until": "{today + dt.timedelta(days=30)}",
  "items": [
    {{"name": "品目名", "qty": 1, "unit": "式", "unit_price": 10000}}
  ],
  "notes": ["補足事項"]
}}

入力:
{request_text}
""".strip()
    response = client.responses.create(model=MODEL, input=prompt)
    text = response.output_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.removeprefix("json").strip()
    data = json.loads(text)
    for item in data["items"]:
        item["amount"] = float(item["qty"]) * float(item["unit_price"])
    return data


def render_html(data):
    items = data["items"]
    subtotal = sum(float(item["amount"]) for item in items)
    tax = subtotal * TAX_RATE
    total = subtotal + tax
    rows = "\n".join(
        f"""
        <tr>
          <td>{html.escape(str(item["name"]))}</td>
          <td class="num">{float(item["qty"]):g}</td>
          <td>{html.escape(str(item.get("unit", "式")))}</td>
          <td class="num">{yen(item["unit_price"])}</td>
          <td class="num">{yen(item["amount"])}</td>
        </tr>
        """
        for item in items
    )
    notes = "\n".join(f"<li>{html.escape(str(note))}</li>" for note in data.get("notes", []))
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>見積書 - {html.escape(str(data["subject"]))}</title>
  <style>
    body {{ font-family: "Yu Gothic", "Meiryo", sans-serif; margin: 40px; color: #222; }}
    .header {{ display: flex; justify-content: space-between; gap: 24px; }}
    h1 {{ font-size: 30px; letter-spacing: 0; margin: 0 0 24px; }}
    .box {{ border: 1px solid #ccc; padding: 14px 16px; margin: 18px 0; }}
    .muted {{ color: #666; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 24px; }}
    th, td {{ border: 1px solid #ccc; padding: 10px; font-size: 14px; }}
    th {{ background: #f3f5f7; text-align: left; }}
    .num {{ text-align: right; }}
    .totals {{ width: 340px; margin-left: auto; margin-top: 18px; }}
    .totals td {{ border: none; border-bottom: 1px solid #ddd; }}
    .total {{ font-size: 20px; font-weight: bold; }}
    @media print {{ body {{ margin: 18mm; }} }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>見積書</h1>
      <p><strong>{html.escape(str(data["client_name"] or "お客様"))}</strong> 御中</p>
      <p class="muted">{html.escape(str(data["overview"]))}</p>
    </div>
    <div>
      <p>発行日: {html.escape(str(data["issue_date"]))}</p>
      <p>見積番号: {html.escape(str(data["quote_no"]))}</p>
      <p>有効期限: {html.escape(str(data["valid_until"]))}</p>
    </div>
  </div>
  <div class="box">
    <p><strong>件名:</strong> {html.escape(str(data["subject"]))}</p>
    <p><strong>発行者:</strong> {html.escape(str(data["seller_name"] or "自社名"))}</p>
  </div>
  <table>
    <thead>
      <tr><th>品目</th><th class="num">数量</th><th>単位</th><th class="num">単価</th><th class="num">金額</th></tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>小計</td><td class="num">{yen(subtotal)}</td></tr>
    <tr><td>消費税 10%</td><td class="num">{yen(tax)}</td></tr>
    <tr class="total"><td>合計</td><td class="num">{yen(total)}</td></tr>
  </table>
  <h2>条件</h2>
  <p>{html.escape(str(data["payment_terms"]))}</p>
  <h2>備考</h2>
  <ul>{notes}</ul>
</body>
</html>
"""


def main():
    request_text = read_request_text()
    if not request_text:
        raise SystemExit("入力がありません。")
    data = extract_estimate(request_text)
    output_dir = Path(__file__).resolve().parent
    quote_no = str(data.get("quote_no", "estimate")).replace("/", "-")
    output_path = output_dir / f"estimate_{quote_no}.html"
    output_path.write_text(render_html(data), encoding="utf-8")
    print(f"\n見積書を作成しました: {output_path}")


if __name__ == "__main__":
    main()
