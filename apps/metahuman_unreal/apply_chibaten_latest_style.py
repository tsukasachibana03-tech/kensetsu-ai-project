import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"

HAIR_PATHS = [
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_L_Straight.WI_Hair_L_Straight",
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_M_Layered.WI_Hair_M_Layered",
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_S_LowPonytail.WI_Hair_S_LowPonytail",
]

OUTFIT_PATH = "/MetaHumanCharacter/Optional/Clothing/WI_DefaultGarment.WI_DefaultGarment"

DARK_PURPLE_HAIR = unreal.LinearColor(0.09, 0.035, 0.18, 1.0)
SOFT_BROWN_EYES = unreal.LinearColor(0.28, 0.16, 0.08, 1.0)
JACKET_RED = unreal.LinearColor(0.52, 0.05, 0.035, 1.0)
WARDROBE_BLACK = unreal.LinearColor(0.005, 0.005, 0.007, 1.0)
SOFT_LIP = unreal.LinearColor(0.42, 0.14, 0.11, 1.0)


def load_first_available(paths):
    for path in paths:
        asset = unreal.load_asset(path)
        if asset:
            unreal.log(f"[ChibatenStyle] Loaded wardrobe item: {path}")
            return path, asset
        unreal.log_warning(f"[ChibatenStyle] Missing wardrobe item: {path}")
    return None, None


def set_hair_parameters(parameters):
    for parameter in parameters:
        name = str(parameter.name)

        if parameter.type == unreal.MetaHumanCharacterInstanceParameterType.FLOAT:
            if name == "Melanin":
                parameter.set_float(value=0.92)
            elif "Redness" in name:
                parameter.set_float(value=0.28)
            elif "Roughness" in name:
                parameter.set_float(value=0.45)

        if parameter.type == unreal.MetaHumanCharacterInstanceParameterType.COLOR:
            if "Color" in name or "Tint" in name or "Dye" in name:
                parameter.set_color(value=DARK_PURPLE_HAIR)


def set_outfit_parameters(parameters):
    for parameter in parameters:
        name = str(parameter.name)

        if parameter.type == unreal.MetaHumanCharacterInstanceParameterType.COLOR:
            if "Shirt" in name or "Top" in name:
                parameter.set_color(value=WARDROBE_BLACK)
            elif "Pant" in name or "Short" in name or "Bottom" in name:
                parameter.set_color(value=WARDROBE_BLACK)
            elif "Primary" in name:
                parameter.set_color(value=WARDROBE_BLACK)
            elif "Secondary" in name:
                parameter.set_color(value=JACKET_RED)


def apply_face_style(character, subsystem):
    character.preview_material_type = unreal.MetaHumanCharacterSkinPreviewMaterial.EDITABLE

    iris = unreal.MetaHumanCharacterEyeIrisProperties()
    iris.pattern = unreal.MetaHumanCharacterEyesIrisPattern.IRIS002
    iris.rotation = 0.35
    iris.primary_color_u = 0.32
    iris.primary_color_v = 0.22
    iris.secondary_color_u = 0.20
    iris.secondary_color_v = 0.14
    iris.color_blend = 0.35
    iris.color_blend_softness = 0.22
    iris.blend_method = unreal.MetaHumanCharacterEyesBlendMethod.RADIAL
    iris.shadow_details = 0.65
    iris.limbal_ring_size = 0.62
    iris.limbal_ring_softness = 0.05
    iris.limbal_ring_color = unreal.LinearColor.BLACK
    iris.global_saturation = 1.25
    iris.global_tint = SOFT_BROWN_EYES

    pupil = unreal.MetaHumanCharacterEyePupilProperties()
    pupil.dilation = 0.48
    pupil.feather = 0.42

    sclera = unreal.MetaHumanCharacterEyeScleraProperties()
    sclera.use_custom_tint = True
    sclera.tint = unreal.LinearColor(0.96, 0.91, 0.86, 1.0)
    sclera.transmission_spread = 0.28

    eye_properties = unreal.MetaHumanCharacterEyeProperties()
    eye_properties.iris = iris
    eye_properties.pupil = pupil
    eye_properties.sclera = sclera

    eyes_settings = character.eyes_settings
    eyes_settings.eye_left = eye_properties
    eyes_settings.eye_right = eye_properties
    subsystem.commit_eyes_settings(character=character, eyes_settings=eyes_settings)

    blusher = unreal.MetaHumanCharacterBlushMakeupProperties()
    blusher.color = unreal.LinearColor(0.55, 0.20, 0.18, 1.0)
    blusher.intensity = 0.10
    blusher.roughness = 0.55
    blusher.type = unreal.MetaHumanCharacterBlushMakeupType.HIGH_CURVE

    eyes_makeup = unreal.MetaHumanCharacterEyeMakeupProperties()
    eyes_makeup.type = unreal.MetaHumanCharacterEyeMakeupType.DRAMATIC_SMUDGE
    eyes_makeup.metalness = 0.05
    eyes_makeup.opacity = 0.16
    eyes_makeup.primary_color = unreal.LinearColor.BLACK
    eyes_makeup.secondary_color = DARK_PURPLE_HAIR

    foundation = unreal.MetaHumanCharacterFoundationMakeupProperties()
    foundation.apply_foundation = False

    lips = unreal.MetaHumanCharacterLipsMakeupProperties()
    lips.color = SOFT_LIP
    lips.metalness = 0.08
    lips.opacity = 0.28
    lips.roughness = 0.25
    lips.type = unreal.MetaHumanCharacterLipsMakeupType.HOLLYWOOD

    makeup_settings = character.makeup_settings
    makeup_settings.blush = blusher
    makeup_settings.eyes = eyes_makeup
    makeup_settings.foundation = foundation
    makeup_settings.lips = lips
    subsystem.commit_makeup_settings(character=character, makeup_settings=makeup_settings)


def apply_style():
    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if not subsystem.try_add_object_to_edit(character):
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the asset editor and run again.")

    try:
        preview_collection = subsystem.get_preview_collection(character)
        if preview_collection is None:
            raise RuntimeError("Preview collection was not available.")

        hair_path, hair_item = load_first_available(HAIR_PATHS)
        if not hair_item:
            raise RuntimeError("No usable MetaHuman hair wardrobe item was found.")

        hair_key = preview_collection.try_add_item_from_wardrobe_item(
            slot_name="Hair",
            wardrobe_item=hair_item,
        )
        hair_selection = unreal.MetaHumanPipelineSlotSelection(
            slot_name="Hair",
            selected_item=hair_key,
        )
        preview_collection.default_instance.try_add_slot_selection(selection=hair_selection)

        outfit_item = unreal.load_asset(OUTFIT_PATH)
        if outfit_item:
            outfit_key = preview_collection.try_add_item_from_wardrobe_item(
                slot_name="Outfits",
                wardrobe_item=outfit_item,
            )
            outfit_selection = unreal.MetaHumanPipelineSlotSelection(
                slot_name="Outfits",
                selected_item=outfit_key,
            )
            preview_collection.default_instance.try_add_slot_selection(selection=outfit_selection)
        else:
            outfit_key = None
            unreal.log_warning("[ChibatenStyle] Default garment item was not found.")

        subsystem.on_edit_preview_collection(character)
        subsystem.assemble_for_preview(character=character)

        hair_item_path = unreal.MetaHumanPaletteItemPath(item_key=hair_key)
        hair_parameters = preview_collection.default_instance.get_instance_parameters(
            item_path=hair_item_path
        )
        set_hair_parameters(hair_parameters)

        if outfit_key:
            outfit_item_path = unreal.MetaHumanPaletteItemPath(item_key=outfit_key)
            outfit_parameters = preview_collection.default_instance.get_instance_parameters(
                item_path=outfit_item_path
            )
            set_outfit_parameters(outfit_parameters)

        subsystem.on_edit_preview_collection(character)
        apply_face_style(character, subsystem)
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)

    unreal.EditorAssetLibrary.save_loaded_asset(character)
    unreal.log("[ChibatenStyle] Applied latest adult red-jacket/dark-purple direction.")


if __name__ == "__main__":
    apply_style()
