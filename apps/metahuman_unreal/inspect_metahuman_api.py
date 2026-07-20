import json
from pathlib import Path

import unreal


OUT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\metahuman_api_inspect.json")


def public_names(obj):
    return [name for name in dir(obj) if not name.startswith("_")]


data = {
    "pipeline_type_dir": public_names(unreal.MetaHumanDefaultPipelineType),
    "quality_level_dir": public_names(unreal.MetaHumanQualityLevel),
    "build_params_dir": public_names(unreal.MetaHumanCharacterEditorBuildParameters()),
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
unreal.log(f"[MetaHumanInspect] Wrote {OUT}")
