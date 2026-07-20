import json
import unreal

OUT = r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\metahuman_face_coefficients_inspect.json"
CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"

character = unreal.load_asset(CHARACTER_PATH)
subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)

data = {
    "docs": {
        "get_face_model_coefficients": str(getattr(subsystem.get_face_model_coefficients, "__doc__", "")),
        "set_face_model_coefficients": str(getattr(subsystem.set_face_model_coefficients, "__doc__", "")),
        "compare_face_state": str(getattr(subsystem.compare_face_state, "__doc__", "")),
        "commit_face_state": str(getattr(subsystem.commit_face_state, "__doc__", "")),
        "commit_body_state": str(getattr(subsystem.commit_body_state, "__doc__", "")),
        "set_body_constraints": str(getattr(subsystem.set_body_constraints, "__doc__", "")),
    }
}

added = subsystem.try_add_object_to_edit(character)
data["added_for_edit"] = bool(added)

try:
    coeffs = subsystem.get_face_model_coefficients(character)
    data["coefficients_type"] = str(type(coeffs))
    data["coefficients_str"] = str(coeffs)[:5000]
    try:
        data["coefficients_len"] = len(coeffs)
        data["coefficients_preview"] = [str(x) for x in list(coeffs)[:80]]
    except Exception as exc:
        data["coefficients_len_error"] = str(exc)
finally:
    if subsystem.is_object_added_for_editing(character):
        subsystem.remove_object_to_edit(character)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

unreal.log(f"[ChibatenCoeffInspect] Wrote {OUT}")
