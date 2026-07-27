$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

New-Item -ItemType Directory -Path ".\backups" -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $PSScriptRoot "backups\mitsumori-$timestamp.json"

Invoke-WebRequest `
  -Uri "http://127.0.0.1:8766/api/export" `
  -OutFile $destination

Write-Host "バックアップを保存しました: $destination"
