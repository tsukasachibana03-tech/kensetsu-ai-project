$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$postgresRoot = "C:\Program Files\PostgreSQL\18"
$python = Join-Path $postgresRoot "pgAdmin 4\python\python.exe"
$serverScript = Join-Path $PSScriptRoot "native\server.py"
$configPath = Join-Path $env:LOCALAPPDATA "MitsumoriPostgres\connection.json"
$runtimeDirectory = Join-Path $env:LOCALAPPDATA "MitsumoriPostgres"
$pidFile = Join-Path $runtimeDirectory "server.pid"

if (-not (Test-Path $configPath)) {
  throw "Initial setup is required. Run setup-native-windows.ps1 first."
}

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:8766/api/health" -TimeoutSec 2
  if ($health.ok -and $health.storage -like "PostgreSQL*") {
    $browserInfo = [Diagnostics.ProcessStartInfo]::new("http://127.0.0.1:8766/")
    $browserInfo.UseShellExecute = $true
    [Diagnostics.Process]::Start($browserInfo) | Out-Null
    Write-Host "Opened the PostgreSQL estimate app."
    exit 0
  }
} catch {
  # Start a new server below.
}

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
$standardOutput = Join-Path $runtimeDirectory "server.out.log"
$standardError = Join-Path $runtimeDirectory "server.err.log"
$env:POSTGRES_BIN = Join-Path $postgresRoot "bin"
$serverProcess = Start-Process `
  -FilePath $python `
  -ArgumentList @("-u", "`"$serverScript`"", "--port", "8766") `
  -WorkingDirectory (Resolve-Path (Join-Path $PSScriptRoot "..")).Path `
  -WindowStyle Hidden `
  -RedirectStandardOutput $standardOutput `
  -RedirectStandardError $standardError `
  -PassThru
Remove-Item Env:POSTGRES_BIN -ErrorAction SilentlyContinue
[IO.File]::WriteAllText($pidFile, [string]$serverProcess.Id)

for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8766/api/health" -TimeoutSec 2
    if ($health.ok -and $health.dataReady) {
      $browserInfo = [Diagnostics.ProcessStartInfo]::new("http://127.0.0.1:8766/")
      $browserInfo.UseShellExecute = $true
      [Diagnostics.Process]::Start($browserInfo) | Out-Null
      Write-Host "Opened the PostgreSQL estimate app. Estimate count: $($health.estimateCount)"
      exit 0
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}

$errorDetails = Get-Content -LiteralPath $standardError -Raw -ErrorAction SilentlyContinue
throw "Could not start the estimate app. Check the PostgreSQL service.`n$errorDetails"
