$ErrorActionPreference = "Stop"
$pidFile = Join-Path $env:LOCALAPPDATA "MitsumoriPostgres\server.pid"

if (-not (Test-Path $pidFile)) {
  Write-Host "見積りアプリのサーバーは停止しています。"
  exit 0
}

$serverPid = [int](Get-Content -Raw $pidFile)
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $serverPid
}
Remove-Item $pidFile -Force
Write-Host "見積りアプリのサーバーを停止しました。"
