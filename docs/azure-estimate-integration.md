# Azure 見積管理統合仕様

## 目的

既存の `apps/mitsumori_app/` を、Azure 上で稼働する知花工務店業務管理システムへ統合する。
工程管理と見積管理は同じ案件 ID、顧客情報、現場情報を使用する。

## 現在の見積データ

現行の PostgreSQL 連携は次の 2 テーブルに JSON 全体を保存する。

- `mitsumori_state`
- `mitsumori_state_history`

初期移行ではこの方式を残し、Azure Functions 経由でクラウド保存できるようにする。
その後、案件・見積・明細を正規化テーブルへ段階移行する。

## Azure 構成

- フロントエンド: Azure Static Web Apps
- API: Azure Functions `chibana-api-2026`
- DB: Azure Database for PostgreSQL `chibana-db`
- 監視: Application Insights

## 第1段階

1. 業務管理システムのメニューに `見積管理` を追加
2. 既存見積アプリを `/estimates` で表示
3. 見積保存・読込を Azure Functions API に接続
4. PostgreSQL の既存 JSON 保存方式を利用
5. ローカル保存も残し、切替可能にする

## API 案

- `GET /api/estimates/state`
- `PUT /api/estimates/state`
- `GET /api/estimates/history`
- `GET /api/estimates/health`

## 第2段階の正規化テーブル

- `projects`
- `customers`
- `estimates`
- `estimate_revisions`
- `estimate_trades`
- `estimate_items`

## 共通案件連携

すべての見積に `project_id` を持たせる。
工程管理側も同じ `project_id` を使用し、以下を参照できるようにする。

- 見積番号
- 見積状態
- 税込合計
- 契約金額
- 工種別金額
- 最新の増減見積額

## 安全方針

- 本番データを直接削除しない
- 既存 JSON 保存機能を残す
- 機能ブランチで開発する
- Azure 反映前に検証環境で確認する
