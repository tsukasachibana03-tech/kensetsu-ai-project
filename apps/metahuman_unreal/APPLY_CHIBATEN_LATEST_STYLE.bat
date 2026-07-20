@echo off
set PROJECT=F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\ChibatenMetaHuman\ChibatenMetaHuman.uproject
set SCRIPT=F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\apply_chibaten_latest_style.py
mkdir "%LOCALAPPDATA%\UnrealEngine\Common\DerivedDataCache\TestData" 2>nul
"C:\Program Files\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" "%PROJECT%" -run=pythonscript -script="%SCRIPT%" -d3d11 -NoSplash -Unattended -DDC-ForceMemoryCache
pause
