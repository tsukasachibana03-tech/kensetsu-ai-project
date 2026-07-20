import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"
BUILD_PATH = "/Game/MetaHumans_UEFN"
COMMON_PATH = "/Game/MetaHumans_UEFN/Common"


def main():
    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character was not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if not subsystem.try_add_object_to_edit(character):
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the MetaHuman editor and run again.")

    try:
        can_build = subsystem.can_build_meta_human(character=character)
        unreal.log(f"[ChibatenBuildUEFN] Can build: {can_build}")
        if not can_build:
            raise RuntimeError("MetaHuman is not prepared yet. Run prepare_chibaten_metahuman.py first.")

        build_params = unreal.MetaHumanCharacterEditorBuildParameters()
        build_params.pipeline_type = unreal.MetaHumanDefaultPipelineType.UEFN
        build_params.pipeline_quality = unreal.MetaHumanQualityLevel.LOW
        build_params.absolute_build_path = BUILD_PATH
        build_params.common_folder_path = COMMON_PATH
        build_params.enable_wardrobe_item_validation = False
        build_params.name_override = "ChibatenSecretary_UEFN"

        unreal.log(f"[ChibatenBuildUEFN] Building MetaHuman to {BUILD_PATH}")
        subsystem.build_meta_human(character=character, params=build_params)
        unreal.EditorAssetLibrary.save_directory(BUILD_PATH)
        unreal.log("[ChibatenBuildUEFN] MetaHuman UEFN build completed.")
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)


if __name__ == "__main__":
    main()
