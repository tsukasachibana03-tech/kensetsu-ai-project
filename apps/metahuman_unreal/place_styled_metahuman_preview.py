import json
from pathlib import Path

import unreal


BP_PATH = "/Game/MetaHumans/ChibatenSecretary/BP_ChibatenSecretary"
ACTOR_LABEL = "Chibaten_Styled_MetaHuman_Preview"
LOG_PATH = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\level_styled_preview_report.json")

MATERIALS = {
    "hair": "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair.MI_WI_Hair_L_StraightBangs_Hair",
    "hair_cards": "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair_Cards.MI_WI_Hair_L_StraightBangs_Hair_Cards",
    "hair_helmet": "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair_Helmet.MI_WI_Hair_L_StraightBangs_Hair_Helmet",
    "red": "/Game/Chibaten/CustomOutfit/cropped_red_jacket.cropped_red_jacket",
    "black": "/Game/Chibaten/CustomOutfit/fitted_black_dress.fitted_black_dress",
    "boots": "/Game/Chibaten/CustomOutfit/black_leather_boots.black_leather_boots",
    "silver": "/Game/Chibaten/CustomOutfit/silver_accessories.silver_accessories",
    "hide": "/Game/MetaHumans/Common/Materials/M_Hide.M_Hide",
}

PURPLE = unreal.LinearColor(0.025, 0.005, 0.060, 1.0)
PURPLE_HIGHLIGHT = unreal.LinearColor(0.08, 0.02, 0.15, 1.0)
JACKET_RED = unreal.LinearColor(0.78, 0.025, 0.018, 1.0)
DRESS_BLACK = unreal.LinearColor(0.003, 0.003, 0.006, 1.0)


def load(path):
    asset = unreal.load_asset(path)
    if not asset:
        unreal.log_warning(f"[ChibatenLevelPreview] Missing asset: {path}")
    return asset


def set_scalar(material, name, value, report):
    try:
        unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
            material, name, value
        )
    except Exception as exc:
        report["errors"].append(
            {"material": str(material.get_name()), "scalar": name, "error": str(exc)}
        )


def set_vector(material, name, value, report):
    try:
        unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(
            material, name, value
        )
    except Exception as exc:
        report["errors"].append(
            {"material": str(material.get_name()), "vector": name, "error": str(exc)}
        )


def tune_materials(material_assets, report):
    for key in ["hair", "hair_cards", "hair_helmet"]:
        material = material_assets.get(key)
        if not material:
            continue
        for name in ["hairDye", "OmbrehairDye", "RegionhairDye", "PaintColor"]:
            set_vector(material, name, PURPLE, report)
        set_vector(material, "HighlightshairDye", PURPLE_HIGHLIGHT, report)
        for name, value in [
            ("hairMelanin", 0.96),
            ("hairRedness", 0.0),
            ("Highlights", 0.0),
            ("Ombre", 0.0),
            ("Region", 0.0),
            ("HighlightsIntensity", 0.0),
            ("WhiteAmount", 0.0),
            ("WhiteMelininHigh", 0.0),
            ("WhiteMelininLow", 0.0),
            ("WhiteMelaninVariation", 0.0),
            ("LightAmount", 0.05),
            ("Intensity", 0.18),
        ]:
            set_scalar(material, name, value, report)

    red_material = material_assets.get("red")
    if red_material and str(red_material.get_name()).startswith("MI_WI_Default"):
        for name in [
            "C_color",
            "diffuse_color_1",
            "diffuse_color_2",
            "B_diffuse_color_1",
            "PrintGraphicColorA",
            "Print1ColorA",
            "Print2ColorA",
        ]:
            set_vector(red_material, name, JACKET_RED, report)
        for name, value in [("C_roughness value", 0.42), ("Metallic", 0.0)]:
            set_scalar(red_material, name, value, report)

    black_material = material_assets.get("black")
    if black_material and str(black_material.get_name()).startswith("MI_WI_Default"):
        for name in [
            "C_color",
            "diffuse_color_1",
            "diffuse_color_2",
            "B_diffuse_color_1",
            "PrintGraphicColorA",
            "Print1ColorA",
            "Print2ColorA",
        ]:
            set_vector(black_material, name, DRESS_BLACK, report)
        for name, value in [("C_roughness value", 0.50), ("Metallic", 0.0)]:
            set_scalar(black_material, name, value, report)

    for material in material_assets.values():
        if material:
            unreal.EditorAssetLibrary.save_loaded_asset(material)


def get_or_spawn_actor(bp_class):
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for actor in actor_subsystem.get_all_level_actors():
        if actor.get_actor_label() == ACTOR_LABEL:
            return actor, False

    actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
        bp_class,
        unreal.Vector(0.0, 0.0, 0.0),
        unreal.Rotator(0.0, 0.0, 0.0),
    )
    actor.set_actor_label(ACTOR_LABEL)
    return actor, True


def collect_actors(root_actor):
    result = [root_actor]
    pending = [root_actor]

    while pending:
        current = pending.pop(0)
        try:
            children = current.get_all_child_actors()
        except Exception:
            children = []
        for child in children:
            if child not in result:
                result.append(child)
                pending.append(child)

    return result


def classify_slot(component, slot_name, current_material):
    comp_name = str(component.get_name()).lower()
    comp_class = str(component.get_class().get_name()).lower()
    slot = str(slot_name).lower()
    mat_name = str(current_material.get_name()).lower() if current_material else ""
    text = f"{comp_name} {comp_class} {slot} {mat_name}"

    skin_words = [
        "skin",
        "body_baked",
        "face",
        "head",
        "eye",
        "iris",
        "sclera",
        "teeth",
        "lash",
        "lacrimal",
    ]
    if any(word in text for word in skin_words):
        return None

    if any(word in text for word in ["mustache", "beard", "fuzz"]):
        return "hide"
    if any(word in text for word in ["hair", "groom", "bangs", "cards", "helmet"]):
        return "hair"
    if any(word in text for word in ["shirt", "top", "upper", "torso", "jacket"]):
        return "red"
    if any(word in text for word in ["short", "pants", "skirt", "dress", "bottom", "garment"]):
        return "black"
    if any(word in text for word in ["shoe", "boot", "foot", "feet"]):
        return "boots"
    if any(word in text for word in ["ear", "necklace", "accessory", "cross", "jewelry"]):
        return "silver"

    return None


def style_component(component, material_assets, report):
    if not hasattr(component, "get_num_materials"):
        return

    try:
        component.set_visibility(True, True)
    except Exception as exc:
        report["errors"].append(
            {"component": str(component.get_name()), "visibility": str(exc)}
        )

    try:
        component.set_hidden_in_game(False)
    except Exception:
        pass

    component_name = str(component.get_name())
    component_class = str(component.get_class().get_name())
    if component_name.lower() in ["fuzz", "mustache", "beard"]:
        try:
            component.set_visibility(False, True)
            report["components"].append(
                {
                    "component": component_name,
                    "class": component_class,
                    "action": "hidden_component",
                }
            )
        except Exception as exc:
            report["errors"].append(
                {"component": component_name, "hide_component": str(exc)}
            )
        return

    material_count = component.get_num_materials()
    slot_names = []

    if hasattr(component, "get_material_slot_names"):
        try:
            slot_names = [str(name) for name in component.get_material_slot_names()]
        except Exception:
            slot_names = []

    for index in range(material_count):
        slot_name = slot_names[index] if index < len(slot_names) else f"slot_{index}"
        try:
            current_material = component.get_material(index)
        except Exception:
            current_material = None

        key = classify_slot(component, slot_name, current_material)
        before = str(current_material.get_name()) if current_material else None

        if not key:
            report["slots"].append(
                {
                    "component": component_name,
                    "class": component_class,
                    "slot": slot_name,
                    "index": index,
                    "before": before,
                    "action": "kept",
                }
            )
            continue

        material = material_assets.get(key)
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
                    "before": before,
                    "action": "styled",
                    "material": key,
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
    bp_class = unreal.EditorAssetLibrary.load_blueprint_class(BP_PATH)
    if not bp_class:
        raise RuntimeError(f"Could not load blueprint class: {BP_PATH}")

    material_assets = {key: load(path) for key, path in MATERIALS.items()}
    report = {
        "bp_path": BP_PATH,
        "actor_label": ACTOR_LABEL,
        "spawned": None,
        "actor_count": 0,
        "components": [],
        "slots": [],
        "errors": [],
    }
    tune_materials(material_assets, report)

    actor, spawned = get_or_spawn_actor(bp_class)
    actor.set_actor_location(unreal.Vector(0.0, 0.0, 220.0), False, False)
    actor.set_actor_rotation(unreal.Rotator(0.0, 0.0, 0.0), False)
    actor.set_actor_hidden_in_game(False)
    try:
        actor.set_is_temporarily_hidden_in_editor(False)
    except Exception:
        pass

    actors = collect_actors(actor)
    report["spawned"] = spawned
    report["actor_count"] = len(actors)

    for item in actors:
        try:
            item.set_actor_hidden_in_game(False)
            item.set_is_temporarily_hidden_in_editor(False)
        except Exception:
            pass
        for cls in [
            unreal.SkeletalMeshComponent,
            unreal.StaticMeshComponent,
            unreal.GroomComponent,
        ]:
            try:
                components = item.get_components_by_class(cls)
            except Exception:
                components = []

            for component in components:
                report["components"].append(
                    {
                        "actor": item.get_actor_label(),
                        "component": str(component.get_name()),
                        "class": str(component.get_class().get_name()),
                        "materials": component.get_num_materials()
                        if hasattr(component, "get_num_materials")
                        else None,
                    }
                )
                style_component(component, material_assets, report)

    try:
        origin = unreal.Vector()
        extent = unreal.Vector()
        origin, extent = actor.get_actor_bounds(False)
        report["bounds"] = {
            "origin": [origin.x, origin.y, origin.z],
            "extent": [extent.x, extent.y, extent.z],
        }
    except Exception as exc:
        report["bounds_error"] = str(exc)

    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actor_subsystem.set_selected_level_actors([actor])

    try:
        light = None
        for level_actor in actor_subsystem.get_all_level_actors():
            if level_actor.get_actor_label() == "Chibaten_Preview_Key_Light":
                light = level_actor
                break
        if light is None:
            light = unreal.EditorLevelLibrary.spawn_actor_from_class(
                unreal.PointLight,
                unreal.Vector(0.0, 250.0, 390.0),
                unreal.Rotator(0.0, 0.0, 0.0),
            )
            light.set_actor_label("Chibaten_Preview_Key_Light")
        light.set_actor_location(unreal.Vector(0.0, 250.0, 390.0), False, False)
        light_component = light.get_component_by_class(unreal.PointLightComponent)
        if light_component:
            light_component.set_editor_property("intensity", 0.0)
            light_component.set_editor_property("attenuation_radius", 750.0)
    except Exception as exc:
        report["errors"].append({"key_light": str(exc)})

    try:
        viewport = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
        camera_location = unreal.Vector(0.0, 520.0, 330.0)
        target_location = unreal.Vector(0.0, 0.0, 310.0)
        camera_rotation = unreal.MathLibrary.find_look_at_rotation(
            camera_location, target_location
        )
        viewport_key = viewport.get_active_viewport_config_key()
        report["active_viewport_key"] = str(viewport_key)
        report["viewport_keys"] = [str(key) for key in viewport.get_viewport_config_keys()]
        viewport.set_level_viewport_camera_info(
            camera_location, camera_rotation, viewport_key
        )
        try:
            viewport.set_level_viewport_fov(35.0, viewport_key)
        except Exception as exc:
            report["errors"].append({"viewport_fov": str(exc)})
        viewport.editor_invalidate_viewports()
    except Exception as exc:
        report["errors"].append({"viewport_camera": str(exc)})

    LOG_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    unreal.EditorLevelLibrary.save_current_level()
    unreal.log("[ChibatenLevelPreview] Styled preview actor placed and selected.")


if __name__ == "__main__":
    main()
