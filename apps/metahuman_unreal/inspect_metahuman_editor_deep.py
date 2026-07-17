import json
import unreal

OUT = r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\metahuman_editor_deep_inspect.json"
CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"


def names(obj):
    return [name for name in dir(obj) if not name.startswith("_")]


def try_props(obj):
    result = {}
    for name in names(obj):
        if name in {"assign", "cast", "copy", "export_text", "import_text", "static_class"}:
            continue
        try:
            value = getattr(obj, name)
        except Exception as exc:
            result[name] = f"<get failed: {exc}>"
            continue
        if callable(value):
            continue
        try:
            result[name] = str(value)
        except Exception:
            result[name] = "<unprintable>"
    return result


character = unreal.load_asset(CHARACTER_PATH)
subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)

data = {
    "character_class": str(character.get_class().get_name()) if character else None,
    "character_dir": names(character) if character else [],
    "character_props": try_props(character) if character else {},
    "subsystem_dir": names(subsystem),
}

for struct_name in [
    "MetaHumanCharacterBodyModel",
    "MetaHumanCharacterBodyIdentity",
    "MetaHumanCharacterHeadModel",
    "MetaHumanCharacterFaceEvaluationSettings",
    "MetaHumanCharacterSkinSettings",
    "MetaHumanCharacterBodySettings",
]:
    cls = getattr(unreal, struct_name, None)
    if cls:
        try:
            inst = cls()
            data[struct_name] = {
                "dir": names(inst),
                "props": try_props(inst),
            }
        except Exception as exc:
            data[struct_name] = f"<construct failed: {exc}>"

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

unreal.log(f"[ChibatenInspectDeep] Wrote {OUT}")
