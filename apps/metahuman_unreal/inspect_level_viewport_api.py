import json
from pathlib import Path

import unreal


OUT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\level_viewport_api.json")

subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)

data = {
    "dir": [name for name in dir(subsystem) if not name.startswith("_")],
    "set_doc": getattr(subsystem.set_level_viewport_camera_info, "__doc__", None),
    "get_doc": getattr(subsystem.get_level_viewport_camera_info, "__doc__", None),
}

OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
unreal.log(f"[ChibatenInspect] Wrote {OUT}")
