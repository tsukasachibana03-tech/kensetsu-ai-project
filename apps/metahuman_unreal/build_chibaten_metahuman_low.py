import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"
BUILD_PATH = "/Game/MetaHumans/ChibatenSecretary"
COMMON_PATH = "/Game/MetaHumans/Common"


def main():
    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character was not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)

    try:
        unreal.log(f"[ChibatenBuildLow] Loaded: {CHARACTER_PATH}")
        unreal.log(f"[ChibatenBuildLow] Can build: {subsystem.can_build_meta_human(character=character)}")
        unreal.log(f"[ChibatenBuildLow] Has high resolution textures: {character.has_high_resolution_textures}")

        if not subsystem.can_build_meta_human(character=character):
            raise RuntimeError("MetaHuman cannot be built yet. Rigging or texture sources are not ready.")

        build_params = unreal.MetaHumanCharacterEditorBuildParameters()
        build_params.pipeline_type = unreal.MetaHumanDefaultPipelineType.OPTIMIZED
        build_params.pipeline_quality = unreal.MetaHumanQualityLevel.LOW
        build_params.absolute_build_path = BUILD_PATH
        build_params.common_folder_path = COMMON_PATH
        build_params.name_override = "ChibatenSecretary"
        build_params.enable_wardrobe_item_validation = False

        unreal.log(f"[ChibatenBuildLow] Building lightweight MetaHuman to {BUILD_PATH}")
        subsystem.build_meta_human(character=character, params=build_params)
        unreal.EditorAssetLibrary.save_directory("/Game/MetaHumans")
        unreal.log("[ChibatenBuildLow] Lightweight MetaHuman build completed.")
    finally:
        unreal.log("[ChibatenBuildLow] Done.")


if __name__ == "__main__":
    main()
