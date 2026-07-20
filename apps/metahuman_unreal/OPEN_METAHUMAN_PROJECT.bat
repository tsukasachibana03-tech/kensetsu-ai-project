@echo off
setlocal

set "UE_EDITOR=C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe"
set "PROJECT=%~dp0ChibatenMetaHuman\ChibatenMetaHuman.uproject"
set "UE_LOCAL=%LOCALAPPDATA%\UnrealEngine"

if not exist "%UE_EDITOR%" (
  echo Unreal Editor was not found:
  echo %UE_EDITOR%
  pause
  exit /b 1
)

if not exist "%PROJECT%" (
  echo Project file was not found:
  echo %PROJECT%
  pause
  exit /b 1
)

mkdir "%UE_LOCAL%\5.8\Intermediate" 2>nul
mkdir "%UE_LOCAL%\5.8\Saved\Config\WindowsEditor" 2>nul
mkdir "%UE_LOCAL%\Common\Zen\Data" 2>nul
mkdir "%UE_LOCAL%\Common\DerivedDataCache\TestData" 2>nul

start "" "%UE_EDITOR%" "%PROJECT%" -d3d11 -NoSplash -DDC-ForceMemoryCache
