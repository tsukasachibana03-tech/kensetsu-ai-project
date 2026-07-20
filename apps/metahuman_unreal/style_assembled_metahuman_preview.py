import json
from pathlib import Path

import unreal


SOURCE_BP = "/Game/MetaHumans/ChibatenSecretary/BP_ChibatenSecretary"
STYLED_BP = "/Game/MetaHumans/ChibatenSecretary/BP_ChibatenSecretary_StyledPreview"
LOG_PATH = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\styled_preview_material_report.json")

MATERIALS = {
    "hair": "/Game/Chibaten/CustomOutfit/deep_purple_hair.deep_purple_hair",
    "hair_highlight": "/Game/Chibaten/CustomOutfit/purple_hair_highlight.purple_hair_highlight",
    "red": "/Game/Chibaten/CustomOutfit/cropped_red_jacket.cropped_red_jacket",
    "black": "/Game/Chibaten/CustomOutfit/fitted_black_dress.fitted_black_dress",
    "boots": "/Game/Chibaten/CustomOutfit/black_leather_boots.black_leather_boots",
    "silver": "/Game/Chibaten/CustomOutfit/silver_accessories.silver_accessories",
}


def load_asset(path):
    asset = unreal.load_asset(path)
    if not asset:
        unreal.log_warning(f"[ChibatenStyledPreview] Missing asset: {path}")
    return asset


def ensure_duplicate():
    if unreal.EditorAssetLibrary.does_asset_exist(STYLED_BP):
        return load_asset(STYLED_BP)

    duplicated = unreal.EditorAssetLibrary.duplicate_asset(SOURCE_BP, STYLED_BP)
    if not duplicated:
        raise RuntimeError(f"Could not duplicate {SOURCE_BP} to {STYLED_BP}")
    unreal.EditorAssetLibrary.save_loaded_asset(duplicated)
    return duplicated


def material_key(component_name, slot_name, component_class):
    text = f"{component_name} {slot_name} {component_class}".lower()

    if any(word in text for word in ["hair", "groom", "cards", "bangs"]):
        return "hair"
    if any(word in text for word in ["shoe", "boot", "feet", "foot"]):
        return "boots"
    if any(word in text for word in ["ear", "necklace", "accessory", "jewelry", "cross"]):
        return "silver"
    if any(word in text for word in ["shirt", "top", "upper", "torso", "jacket"]):
        return "red"
    if any(word in text for word in ["short", "bottom", "pants", "skirt", "dress", "garment"]):
        return "black"

    return None


def apply_materials_to_component(component, material_assets, report):
    if not hasattr(component, "get_num_materials"):
        return

    component_name = str(component.get_name())
    component_class = str(component.get_class().get_name())
    material_count = component.get_num_materials()

    slot_names = []
    if hasattr(component, "get_material_slot_names"):
        try:
            slot_names = [str(name) for name in component.get_material_slot_names()]
        except Exception:
            slot_names = []

    for index in range(material_count):
        slot_name = slot_names[index] if index < len(slot_names) else f"slot_{index}"
        chosen_key = material_key(component_name, slot_name, component_class)

        if not chosen_key:
            report["slots"].append(
                {
                    "component": component_name,
                    "class": component_class,
                    "slot": slot_name,
                    "index": index,
                    "action": "kept",
                }
            )
            continue

        material = material_assets.get(chosen_key)
        if not material:
            continue

        try:
            component.set_material(index, material)
            report["slots"].append(
                {
                    "component": component_name,
                    "class": component_class,
                    "slot": slot_name,
                    "index": index,
                    "action": "styled",
                    "material": chosen_key,
                }
            )
        except Exception as exc:
            report["errors"].append(
                {
                    "component": component_name,
                    "slot": slot_name,
                    "index": index,
                    "error": str(exc),
                }
            )


def main():
    bp_asset = ensure_duplicate()
    bp_class = unreal.EditorAssetLibrary.load_blueprint_class(STYLED_BP)
    if not bp_class:
        raise RuntimeError(f"Could not load blueprint class: {STYLED_BP}")

    material_assets = {key: load_asset(path) for key, path in MATERIALS.items()}
    cdo = unreal.get_default_object(bp_class)
    components = []

    for cls in [
        unreal.SkeletalMeshComponent,
        unreal.StaticMeshComponent,
        unreal.GroomComponent,
    ]:
        try:
            components.extend(cdo.get_components_by_class(cls))
        except Exception:
            pass

    report = {
        "source": SOURCE_BP,
        "styled": STYLED_BP,
        "component_count": len(components),
        "slots": [],
        "errors": [],
    }

    for component in components:
        apply_materials_to_component(component, material_assets, report)

    try:
        unreal.KismetEditorUtilities.compile_blueprint(bp_asset)
    except Exception as exc:
        report["errors"].append({"compile": str(exc)})

    unreal.EditorAssetLibrary.save_loaded_asset(bp_asset)
    unreal.EditorAssetLibrary.save_directory("/Game/MetaHumans/ChibatenSecretary")

    LOG_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    unreal.get_editor_subsystem(unreal.AssetEditorSubsystem).open_editor_for_assets([bp_asset])
    unreal.log("[ChibatenStyledPreview] Styled preview blueprint opened.")


if __name__ == "__main__":
    main()
