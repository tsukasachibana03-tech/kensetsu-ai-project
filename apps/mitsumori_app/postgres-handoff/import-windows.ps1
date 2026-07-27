$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$dataFile = Get-ChildItem -Path ".\imports" -Filter "*.json" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $dataFile) {
  throw "importsフォルダーに見積りデータがありません。"
}

$result = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8766/api/import" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -InFile $dataFile.FullName

Write-Host "PostgreSQLへ取り込みました。見積り件数: $($result.estimateCount)"
