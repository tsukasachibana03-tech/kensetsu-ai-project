@echo off
cd /d "%~dp0"
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

"%PYTHON_EXE%" %PYTHON_ARGS% -m http.server 8766
