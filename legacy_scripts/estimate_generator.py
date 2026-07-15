import datetime as dt
import html
import json
import os
from pathlib import Path

from openai import OpenAI


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
TAX_RATE = 0.10


def ask(label, default=""):
    value = input(f"{label}" + (f" [{default}]" if default else "") + ": ").strip()
    return value or default


def yen(amount):
    return f"{round(amount):,}円"


def collect_items():
    print("\n明細を入力します。空の品目名で終了します。")
    items = []
    while True:
        name = ask("品目名")
        if not name:
            break
        qty = float(ask("数量", "1"))
        unit = ask("単位", "式")
        unit_price = float(ask("単価", "0"))
        items.append(
            {
                "name": name,
                "qty": qty,
                "unit": unit,
                "unit_price": unit_price,
                "amount": qty * unit_price,
            }
        )
    return items


def improve_text_with_api(raw):
    client = OpenAI()
    prompt = f"""
あなたは日本のビジネス文書に強い事務担当者です。
以下の見積情報から、見積書に入れる自然で簡潔な日本語を作ってください。
金額や明細は変更しないでください。

必ずJSONだけで返してください。
形式:
{{
  "subject": "見積件名",
  "overview": "見積概要。1〜2文。",
  "notes": ["補足事項1", "補足事項2"],
  "payment_terms": "支払条件",
  "valid_until": "有効期限"
}}

入力:
{json.dumps(raw, ensure_ascii=False)}
""".strip()

    response = client.responses.create(model=MODEL, input=prompt)
    text = response.output_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.removeprefix("json").strip()
    return json.loads(text)


def render_html(data, ai_text):
    items = data["items"]
    subtotal = sum(item["amount"] for item in items)
    tax = subtotal * TAX_RATE
    total = subtotal + tax

    rows = "\n".join(
        f"""
        <tr>
          <td>{html.escape(item["name"])}</td>
          <td class="num">{item["qty"]:g}</td>
          <td>{html.escape(item["unit"])}</td>
          <td class="num">{yen(item["unit_price"])}</td>
          <td class="num">{yen(item["amount"])}</td>
        </tr>
        """
        for item in items
    )
    notes = "\n".join(f"<li>{html.escape(note)}</li>" for note in ai_text.get("notes", []))

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>見積書 - {html.escape(ai_text["subject"])}</title>
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
      <p><strong>{html.escape(data["client_name"])}</strong> 御中</p>
      <p class="muted">{html.escape(ai_text["overview"])}</p>
    </div>
    <div>
      <p>発行日: {html.escape(data["issue_date"])}</p>
      <p>見積番号: {html.escape(data["quote_no"])}</p>
      <p>有効期限: {html.escape(ai_text["valid_until"])}</p>
    </div>
  </div>

  <div class="box">
    <p><strong>件名:</strong> {html.escape(ai_text["subject"])}</p>
    <p><strong>発行者:</strong> {html.escape(data["seller_name"])}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>品目</th>
        <th class="num">数量</th>
        <th>単位</th>
        <th class="num">単価</th>
        <th class="num">金額</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>

  <table class="totals">
    <tr><td>小計</td><td class="num">{yen(subtotal)}</td></tr>
    <tr><td>消費税 10%</td><td class="num">{yen(tax)}</td></tr>
    <tr class="total"><td>合計</td><td class="num">{yen(total)}</td></tr>
  </table>

  <h2>条件</h2>
  <p>{html.escape(ai_text["payment_terms"])}</p>

  <h2>備考</h2>
  <ul>{notes}</ul>
</body>
</html>
"""


def main():
    today = dt.date.today()
    data = {
        "quote_no": ask("見積番号", f"Q-{today:%Y%m%d}-001"),
        "issue_date": ask("発行日", str(today)),
        "seller_name": ask("自社名"),
        "client_name": ask("宛先会社名"),
        "subject": ask("件名", "業務委託費用のお見積り"),
        "overview": ask("概要", "ご依頼内容に基づき、以下の通りお見積りいたします。"),
        "payment_terms": ask("支払条件", "納品月末締め、翌月末払い"),
        "valid_until": ask("有効期限", str(today + dt.timedelta(days=30))),
        "items": collect_items(),
    }
    if not data["items"]:
        raise SystemExit("明細がありません。少なくとも1件入力してください。")

    ai_text = improve_text_with_api(data)
    output_dir = Path(__file__).resolve().parent
    output_path = output_dir / f"estimate_{data['quote_no'].replace('/', '-')}.html"
    output_path.write_text(render_html(data, ai_text), encoding="utf-8")
    print(f"\n見積書を作成しました: {output_path}")


if __name__ == "__main__":
    main()
