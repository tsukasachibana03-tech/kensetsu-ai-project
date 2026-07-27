# 見積りアプリ PostgreSQL 引継ぎ

このフォルダーは、見積りアプリと保存済み見積りをノートPCへ引き継ぐための一式です。
見積りデータはPostgreSQLへ保存され、更新前の内容も履歴として残ります。

## PostgreSQLをWindowsへ直接インストールした場合

1. `setup-native-windows.ps1` を右クリックし、「PowerShellで実行」を選びます。
2. PostgreSQLのインストール時に決めたパスワードを入力します。
3. 現在の見積りデータが自動で取り込まれ、アプリが開きます。
4. 2回目以降は `start-native-windows.ps1` で開きます。

管理者用パスワードは保存しません。見積りアプリ専用の接続情報だけを、
そのWindows利用者のローカル設定へ保存します。

## Docker Desktopを使う場合

1. Dropboxの同期が終わるまで待ちます。
2. Docker Desktopをインストールして起動します。
3. `start-windows.ps1` を右クリックし、「PowerShellで実行」を選びます。
4. 見積りアプリが自動で開きます。

初回だけ安全なデータベース用パスワードが自動作成されます。
`imports/mitsumori_data.json` は、データベースが空のときだけ自動で取り込まれます。

## MacノートPC

1. Dropboxの同期が終わるまで待ちます。
2. Docker Desktopをインストールして起動します。
3. ターミナルでこのフォルダーを開き、最初の一度だけ
   `chmod +x *.command` を実行します。
4. `start-mac.command` をダブルクリックします。

## 保存と読込

- アプリ上部の「保存」でPostgreSQLへ保存します。
- 「保存済みデータ読込」でPostgreSQLの最新版を読み込みます。
- 別PCの更新を検出した場合は上書きせず、再読込を案内します。

## バックアップ

- Windows: `backup-windows.ps1`
- Mac: `backup-mac.command`

作成されたJSONは `backups` に保存され、Dropboxでも同期されます。
復元は同じフォルダーの `restore` ファイルを実行します。

## 保存場所

- 見積りデータ本体: Docker内のPostgreSQL
- 引継ぎ元JSON: `imports/mitsumori_data.json`
- バックアップ: `backups`
- 印刷用PDF: `prints`

PostgreSQLの5433番ポートは、インターネットへ公開しないでください。
