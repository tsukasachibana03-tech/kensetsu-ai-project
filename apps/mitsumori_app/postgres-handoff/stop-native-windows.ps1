$ErrorActionPreference = "Stop"
$pidFile = Join-Path $env:LOCALAPPDATA "MitsumoriPostgres\server.pid"

if (-not (Test-Path $pidFile)) {
  Write-Host "The estimate app server is already stopped."
  exit 0
}

$serverPid = [int](Get-Content -Raw $pidFile)
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $serverPid
}
Remove-Item $pidFile -Force
Write-Host "Stopped the estimate app server."
