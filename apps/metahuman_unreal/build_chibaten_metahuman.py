import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"
BUILD_PATH = "/Game/MetaHumans"
COMMON_PATH = "/Game/MetaHumans/Common"


def main():
    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character was not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if not subsystem.try_add_object_to_edit(character):
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the MetaHuman editor and run again.")

    try:
        unreal.log(f"[ChibatenBuild] Loaded: {CHARACTER_PATH}")
        unreal.log(f"[ChibatenBuild] Has high resolution textures: {character.has_high_resolution_textures}")
        unreal.log(f"[ChibatenBuild] Can build before requests: {subsystem.can_build_meta_human(character=character)}")

        if not subsystem.can_build_meta_human(character=character):
            unreal.log("[ChibatenBuild] Requesting MetaHuman auto-rigging.")
            rig_params = unreal.MetaHumanCharacterAutoRiggingRequestParams()
            rig_params.blocking = True
            rig_params.report_progress = True
            rig_params.rig_type = unreal.MetaHumanRigType.JOINTS_ONLY
            subsystem.request_auto_rigging(character=character, params=rig_params)

            unreal.log("[ChibatenBuild] Requesting MetaHuman texture sources.")
            texture_params = unreal.MetaHumanCharacterTextureRequestParams()
            texture_params.blocking = True
            texture_params.report_progress = True
            subsystem.request_texture_sources(character=character, params=texture_params)

        can_build = subsystem.can_build_meta_human(character=character)
        unreal.log(f"[ChibatenBuild] Can build after requests: {can_build}")
        unreal.log(f"[ChibatenBuild] Has high resolution textures after requests: {character.has_high_resolution_textures}")

        if not can_build:
            raise RuntimeError("MetaHuman cannot be built yet. Auto-rigging or texture download did not complete.")

        build_params = unreal.MetaHumanCharacterEditorBuildParameters()
        build_params.pipeline_type = unreal.MetaHumanDefaultPipelineType.OPTIMIZED
        build_params.pipeline_quality = unreal.MetaHumanQualityLevel.MEDIUM
        build_params.absolute_build_path = BUILD_PATH
        build_params.common_folder_path = COMMON_PATH
        build_params.enable_wardrobe_item_validation = False

        unreal.log(f"[ChibatenBuild] Building MetaHuman to {BUILD_PATH}")
        subsystem.build_meta_human(character=character, params=build_params)
        unreal.EditorAssetLibrary.save_directory(BUILD_PATH)
        unreal.log("[ChibatenBuild] MetaHuman build completed.")
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)


if __name__ == "__main__":
    main()
