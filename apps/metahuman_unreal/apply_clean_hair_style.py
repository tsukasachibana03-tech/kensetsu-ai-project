import json
from pathlib import Path

import unreal


CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"
REPORT_PATH = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\clean_hair_style_report.json")

HAIR_PATHS = [
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_L_Straight.WI_Hair_L_Straight",
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_M_Layered.WI_Hair_M_Layered",
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_S_LowPonytail.WI_Hair_S_LowPonytail",
]

DARK_PURPLE_HAIR = unreal.LinearColor(0.035, 0.010, 0.085, 1.0)
PURPLE_HIGHLIGHT = unreal.LinearColor(0.100, 0.035, 0.180, 1.0)


def load_first_available(paths, report):
    for path in paths:
        asset = unreal.load_asset(path)
        report["hair_candidates"].append({"path": path, "loaded": bool(asset)})
        if asset:
            return path, asset
    return None, None


def set_hair_parameters(parameters, report):
    for parameter in parameters:
        name = str(parameter.name)
        ptype = str(parameter.type)
        changed = False

        if parameter.type == unreal.MetaHumanCharacterInstanceParameterType.FLOAT:
            values = {
                "Melanin": 0.98,
                "Redness": 0.05,
                "Roughness": 0.44,
                "SaltAndPepper": 0.0,
                "Lightness": 0.20,
            }
            for key, value in values.items():
                if key.lower() in name.lower():
                    parameter.set_float(value=value)
                    changed = True
                    break

        if parameter.type == unreal.MetaHumanCharacterInstanceParameterType.COLOR:
            if any(key in name for key in ["Color", "Tint", "Dye"]):
                parameter.set_color(value=DARK_PURPLE_HAIR)
                changed = True
            if "Highlight" in name:
                parameter.set_color(value=PURPLE_HIGHLIGHT)
                changed = True

        report["hair_parameters"].append(
            {"name": name, "type": ptype, "changed": changed}
        )


def add_or_select_hair(preview_collection, hair_item, report):
    hair_key = preview_collection.try_add_item_from_wardrobe_item(
        slot_name="Hair",
        wardrobe_item=hair_item,
    )
    report["hair_key"] = str(hair_key)

    hair_selection = unreal.MetaHumanPipelineSlotSelection(
        slot_name="Hair",
        selected_item=hair_key,
    )
    selection_result = preview_collection.default_instance.try_add_slot_selection(
        selection=hair_selection
    )
    report["selection_result"] = str(selection_result)

    hair_item_path = unreal.MetaHumanPaletteItemPath(item_key=hair_key)
    hair_parameters = preview_collection.default_instance.get_instance_parameters(
        item_path=hair_item_path
    )
    set_hair_parameters(hair_parameters, report)


def main():
    report = {
        "character_path": CHARACTER_PATH,
        "hair_candidates": [],
        "hair_path": None,
        "hair_key": None,
        "selection_result": None,
        "hair_parameters": [],
        "object_added": False,
        "can_build": None,
        "assembled_preview": False,
        "errors": [],
    }

    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    added = subsystem.is_object_added_for_editing(character)
    if not added:
        added = subsystem.try_add_object_to_edit(character)
    report["object_added"] = bool(added)
    if not added:
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the MetaHuman character editor and run again.")

    try:
        preview_collection = subsystem.get_preview_collection(character)
        if preview_collection is None:
            raise RuntimeError("Preview collection was not available.")

        hair_path, hair_item = load_first_available(HAIR_PATHS, report)
        report["hair_path"] = hair_path
        if not hair_item:
            raise RuntimeError("No clean MetaHuman hair wardrobe item was found.")

        add_or_select_hair(preview_collection, hair_item, report)
        subsystem.on_edit_preview_collection(character)

        try:
            subsystem.assemble_for_preview(character=character)
            report["assembled_preview"] = True
        except Exception as exc:
            report["errors"].append({"assemble_for_preview": str(exc)})

        try:
            report["can_build"] = bool(subsystem.can_build_meta_human(character=character))
        except Exception as exc:
            report["errors"].append({"can_build": str(exc)})

    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)

    unreal.EditorAssetLibrary.save_loaded_asset(character)
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    unreal.log(f"[ChibatenCleanHair] Applied clean hair style: {report['hair_path']}")


if __name__ == "__main__":
    main()
