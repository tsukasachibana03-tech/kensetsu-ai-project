@echo off
set BLENDER=C:\Program Files\Blender Foundation\Blender 4.5\blender.exe
set SCRIPT=F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\custom_parts\create_chibaten_outfit_proxy.py
"%BLENDER%" --background --python "%SCRIPT%"
pause
