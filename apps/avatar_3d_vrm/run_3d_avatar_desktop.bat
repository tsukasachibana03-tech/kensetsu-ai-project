@echo off
set "APP_DIR=%~dp0"
set "PYTHON_EXE="
set "PYTHON_ARGS="
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" set "PYTHON_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not defined PYTHON_EXE where py >nul 2>nul && set "PYTHON_EXE=py" && set "PYTHON_ARGS=-3"
if not defined PYTHON_EXE where python >nul 2>nul && set "PYTHON_EXE=python"

if not defined PYTHON_EXE (
  echo Python was not found. Please install Python, then run this file again.
  pause
  exit /b 1
)

set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=8766; $listening=(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue); if(-not $listening){ $python='%PYTHON_EXE%'; $args=@(); if('%PYTHON_ARGS%' -ne ''){ $args += '%PYTHON_ARGS%' }; $args += @('-m','http.server','8766'); Start-Process -WindowStyle Hidden -FilePath $python -ArgumentList $args -WorkingDirectory '%APP_DIR%' }"

if exist "%EDGE_EXE%" (
  start "" "%EDGE_EXE%" --app="http://127.0.0.1:8766/viewer/index.html?desktop=1" --window-size=520,760
) else (
  start "" "http://127.0.0.1:8766/viewer/index.html?desktop=1"
)
