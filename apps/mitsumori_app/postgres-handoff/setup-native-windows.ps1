$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Read-PostgresPassword {
  $form = New-Object Windows.Forms.Form
  $form.Text = "PostgreSQL - Estimate App Handoff"
  $form.StartPosition = "CenterScreen"
  $form.ClientSize = New-Object Drawing.Size(430, 175)
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true

  $message = New-Object Windows.Forms.Label
  $message.Text = "Enter the PostgreSQL password chosen during installation."
  $message.Location = New-Object Drawing.Point(24, 22)
  $message.Size = New-Object Drawing.Size(380, 38)
  $form.Controls.Add($message)

  $passwordBox = New-Object Windows.Forms.TextBox
  $passwordBox.Location = New-Object Drawing.Point(24, 67)
  $passwordBox.Size = New-Object Drawing.Size(380, 26)
  $passwordBox.UseSystemPasswordChar = $true
  $form.Controls.Add($passwordBox)

  $continueButton = New-Object Windows.Forms.Button
  $continueButton.Text = "Continue"
  $continueButton.Location = New-Object Drawing.Point(224, 115)
  $continueButton.Size = New-Object Drawing.Size(85, 30)
  $continueButton.DialogResult = [Windows.Forms.DialogResult]::OK
  $form.Controls.Add($continueButton)

  $cancelButton = New-Object Windows.Forms.Button
  $cancelButton.Text = "Cancel"
  $cancelButton.Location = New-Object Drawing.Point(319, 115)
  $cancelButton.Size = New-Object Drawing.Size(85, 30)
  $cancelButton.DialogResult = [Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancelButton)

  $form.AcceptButton = $continueButton
  $form.CancelButton = $cancelButton
  $form.Add_Shown({ $passwordBox.Focus() })
  $result = $form.ShowDialog()
  $password = $passwordBox.Text
  $form.Dispose()

  if ($result -ne [Windows.Forms.DialogResult]::OK) {
    throw "Setup was cancelled."
  }
  if ([string]::IsNullOrWhiteSpace($password)) {
    throw "A PostgreSQL password is required."
  }
  return $password
}

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
  throw "PostgreSQL 18 was not found. Install PostgreSQL first."
}
if (-not (Test-Path $python)) {
  throw "The pgAdmin runtime was not found. Install PostgreSQL with pgAdmin."
}
if (-not $dataFile) {
  throw "The handoff source file mitsumori_data.json was not found."
}

$adminPassword = Read-PostgresPassword

try {
  $randomBytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  $random.GetBytes($randomBytes)
  $random.Dispose()
  $appPassword = (($randomBytes | ForEach-Object { $_.ToString("x2") }) -join "")

  $env:PGPASSWORD = $adminPassword
  $roleOutput = @(& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='mitsumori_app';")
  $roleExitCode = $LASTEXITCODE
  if ($roleExitCode -ne 0) {
    throw "Could not connect to PostgreSQL. Check the password."
  }
  $roleExists = ($roleOutput -join "").Trim()

  if ($roleExists -eq "1") {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE mitsumori_app WITH LOGIN PASSWORD '$appPassword';"
  } else {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE mitsumori_app WITH LOGIN PASSWORD '$appPassword';"
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create the estimate app database user."
  }

  $databaseOutput = @(& $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='mitsumori';")
  $databaseExitCode = $LASTEXITCODE
  if ($databaseExitCode -ne 0) {
    throw "Could not check the estimate database."
  }
  $databaseExists = ($databaseOutput -join "").Trim()
  if ($databaseExists -ne "1") {
    & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE mitsumori OWNER mitsumori_app;"
    if ($LASTEXITCODE -ne 0) {
      throw "Could not create the estimate database."
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
    throw "Could not prepare the estimate database."
  }

  $env:POSTGRES_BIN = Join-Path $postgresRoot "bin"
  & $python $serverScript --import $dataFile
  if ($LASTEXITCODE -ne 0) {
    throw "Could not import the estimate data."
  }
} catch {
  [Windows.Forms.MessageBox]::Show(
    $_.Exception.Message,
    "Estimate App Handoff",
    [Windows.Forms.MessageBoxButtons]::OK,
    [Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
  exit 1
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:POSTGRES_BIN -ErrorAction SilentlyContinue
  $adminPassword = $null
}

Write-Host ""
Write-Host "Estimate data was handed off to PostgreSQL."
[Windows.Forms.MessageBox]::Show(
  "Estimate data was handed off to PostgreSQL. The app will open now.",
  "Estimate App Handoff",
  [Windows.Forms.MessageBoxButtons]::OK,
  [Windows.Forms.MessageBoxIcon]::Information
) | Out-Null
& (Join-Path $PSScriptRoot "start-native-windows.ps1")
