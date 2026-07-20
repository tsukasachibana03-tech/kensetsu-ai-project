import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"


def main():
    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character was not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if not subsystem.try_add_object_to_edit(character):
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the MetaHuman editor and run again.")

    try:
        unreal.log(f"[ChibatenPrepare] Loaded: {CHARACTER_PATH}")
        unreal.log(f"[ChibatenPrepare] Can build before requests: {subsystem.can_build_meta_human(character=character)}")

        if not subsystem.can_build_meta_human(character=character):
            rig_params = unreal.MetaHumanCharacterAutoRiggingRequestParams()
            rig_params.blocking = True
            rig_params.report_progress = True
            rig_params.rig_type = unreal.MetaHumanRigType.JOINTS_ONLY
            subsystem.request_auto_rigging(character=character, params=rig_params)

            texture_params = unreal.MetaHumanCharacterTextureRequestParams()
            texture_params.blocking = True
            texture_params.report_progress = True
            subsystem.request_texture_sources(character=character, params=texture_params)

        unreal.EditorAssetLibrary.save_loaded_asset(character)
        unreal.log(f"[ChibatenPrepare] Can build after prepare: {subsystem.can_build_meta_human(character=character)}")
        unreal.log("[ChibatenPrepare] Saved prepared MetaHuman character.")
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)


if __name__ == "__main__":
    main()
