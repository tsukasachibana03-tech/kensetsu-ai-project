$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$backupFile = Get-ChildItem -Path ".\backups" -Filter "*.json" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $backupFile) {
  throw "backupsフォルダーに復元用データがありません。"
}

$result = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8766/api/import" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -InFile $backupFile.FullName

Write-Host "復元しました。見積り件数: $($result.estimateCount)"
