@echo off
setlocal

set "UE_CMD=C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe"
set "PROJECT=%~dp0ChibatenMetaHuman\ChibatenMetaHuman.uproject"
set "SCRIPT=%~dp0create_chibaten_secretary.py"
set "UE_LOCAL=%LOCALAPPDATA%\UnrealEngine"

mkdir "%UE_LOCAL%\5.8\Intermediate" 2>nul
mkdir "%UE_LOCAL%\5.8\Saved\Config\WindowsEditor" 2>nul
mkdir "%UE_LOCAL%\Common\Zen\Data" 2>nul

"%UE_CMD%" "%PROJECT%" -run=pythonscript -script="%SCRIPT%" -d3d11 -NoSplash -Unattended
