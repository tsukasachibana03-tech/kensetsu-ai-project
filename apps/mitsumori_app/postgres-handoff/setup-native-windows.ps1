$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$postgresRoot = "C:\Program Files\PostgreSQL\18"
$psql = Join-Path $postgresRoot "bin\psql.exe"
$python = Join-Path $postgresRoot "pgAdmin 4\python\python.exe"
$serverScript = Join-Path $PSScriptRoot "native\server.py"
$schemaFile = Join-Path $PSScriptRoot "database\001_schema.sql"
$appRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dataCandidates = @(
  (Join-Path $PSScriptRoot "imports\mitsumori_data.json"),
  (Join-Path $appRoot "..\..\..\mitsumori_data.json")
)
$dataFile = $dataCandidates |
  Where-Object { Test-Path $_ } |
  Select-Object -First 1

if (-not (Test-Path $psql)) {
  throw "PostgreSQL 18が見つかりません。先にPostgreSQLをインストールしてください。"
}
if (-not (Test-Path $python)) {
  throw "pgAdminの実行環境が見つかりません。PostgreSQLをpgAdmin付きでインストールしてください。"
}
if (-not $dataFile) {
  throw "引継ぎ元のmitsumori_data.jsonが見つかりません。"
}

$securePassword = Read-Host "PostgreSQLのインストール時に決めたパスワードを入力してください" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$adminPassword = $null

try {
  $adminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $randomBytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  $random.GetBytes($randomBytes)
  $random.Dispose()
  $appPassword = (($randomBytes | ForEach-Object { $_.ToString("x2") }) -join "")

  $env:PGPASSWORD = $adminPassword
  $roleExists = (& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='mitsumori_app';").Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQLへ接続できませんでした。パスワードを確認してください。"
  }

  if ($roleExists -eq "1") {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE mitsumori_app WITH LOGIN PASSWORD '$appPassword';"
  } else {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE mitsumori_app WITH LOGIN PASSWORD '$appPassword';"
  }
  if ($LASTEXITCODE -ne 0) {
    throw "見積りアプリ用の利用者作成に失敗しました。"
  }

  $databaseExists = (& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='mitsumori';").Trim()
  if ($databaseExists -ne "1") {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE mitsumori OWNER mitsumori_app;"
    if ($LASTEXITCODE -ne 0) {
      throw "見積りデータベースの作成に失敗しました。"
    }
  } else {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE mitsumori OWNER TO mitsumori_app;"
  }

  $configDirectory = Join-Path $env:LOCALAPPDATA "MitsumoriPostgres"
  $configPath = Join-Path $configDirectory "connection.json"
  New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
  $config = [ordered]@{
    host = "127.0.0.1"
    port = 5432
    dbname = "mitsumori"
    user = "mitsumori_app"
    password = $appPassword
  } | ConvertTo-Json
  [IO.File]::WriteAllText($configPath, $config, [Text.UTF8Encoding]::new($false))

  $env:PGPASSWORD = $appPassword
  & $psql -h 127.0.0.1 -p 5432 -U mitsumori_app -d mitsumori -v ON_ERROR_STOP=1 -f $schemaFile
  if ($LASTEXITCODE -ne 0) {
    throw "見積りデータベースの準備に失敗しました。"
  }

  $env:POSTGRES_BIN = Join-Path $postgresRoot "bin"
  & $python $serverScript --import $dataFile
  if ($LASTEXITCODE -ne 0) {
    throw "見積りデータの取り込みに失敗しました。"
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:POSTGRES_BIN -ErrorAction SilentlyContinue
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  $adminPassword = $null
}

Write-Host ""
Write-Host "見積りデータをPostgreSQLへ引き継ぎました。"
& (Join-Path $PSScriptRoot "start-native-windows.ps1")
