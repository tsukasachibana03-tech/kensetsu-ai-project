# 見積りアプリ PostgreSQL 引継ぎ

このフォルダーは、見積りアプリと保存済み見積りをノートPCへ引き継ぐためのものです。

## 保存の仕組み

- ノートPCではPostgreSQLへ保存します。
- 同時にDropbox直下の `mitsumori_data.json` へ最新版を自動保存します。
- 別のPCがDropbox側を更新した場合は、アプリを開いたときや「保存済みデータ読込」を押したときに新しい内容を判定します。
- PostgreSQLには更新前データの履歴が残ります。
- Dropboxには直前の正常データが `mitsumori_data.json.last-good` として残ります。
- PostgreSQLの接続パスワードはWindowsの利用者用フォルダーだけに保存し、DropboxやGitHubには保存しません。

## Windowsで開く

初回だけDropbox直下の `見積り引継ぎ開始.bat` を実行します。
引継ぎ完了後は、Dropbox直下の `見積りアプリを開く.bat` をダブルクリックします。

## バックアップ

`backup-windows.ps1` を実行すると、PostgreSQLの最新版を `backups` フォルダーへJSON形式で保存します。
`restore-windows.ps1` は、そのフォルダー内で最も新しいバックアップを復元します。

## 主な保存場所

- PostgreSQL本体: ノートPC内のデータベース
- PC間で共有する最新版: Dropbox直下の `mitsumori_data.json`
- 直前の正常データ: Dropbox直下の `mitsumori_data.json.last-good`
- 手動バックアップ: `postgres-handoff/backups`
- 印刷用PDF: Windowsのドキュメント内 `MitsumoriPrints`

PostgreSQLの5432番ポートと見積りアプリの8766番ポートは、インターネットへ公開しないでください。
