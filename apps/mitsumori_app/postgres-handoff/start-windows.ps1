$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktopが見つかりません。Docker Desktopをインストールして起動してください。"
}

if (-not (Test-Path ".env")) {
  $bytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  $random.GetBytes($bytes)
  $random.Dispose()
  $password = [Convert]::ToBase64String($bytes).Replace("+", "A").Replace("/", "B").TrimEnd("=")
  $lines = @(
    "POSTGRES_DB=mitsumori"
    "POSTGRES_USER=mitsumori"
    "POSTGRES_PASSWORD=$password"
    "POSTGRES_PORT=5433"
    "APP_PORT=8766"
  )
  [IO.File]::WriteAllLines((Join-Path $PSScriptRoot ".env"), $lines)
}

docker compose up -d --build

for ($attempt = 0; $attempt -lt 60; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8766/api/health" -TimeoutSec 2
    if ($health.ok -and $health.dataReady) {
      Start-Process "http://127.0.0.1:8766/"
      Write-Host "見積りアプリを開きました。保存先はPostgreSQLです。"
      exit 0
    }
  } catch {
    Start-Sleep -Seconds 2
  }
}

throw "起動確認に時間がかかっています。Docker Desktopの画面を確認してください。"
