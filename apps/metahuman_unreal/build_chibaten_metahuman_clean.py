import json
from pathlib import Path

import unreal


CHARACTER_PATH = "/Game/Characters/MetaHumans/ChibatenSecretary.ChibatenSecretary"
BUILD_PATH = "/Game/MetaHumans"
COMMON_PATH = "/Game/MetaHumans/Common"
REPORT_PATH = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\clean_metahuman_build_report.json")


def ensure_ready(character, subsystem, report):
    report["can_build_before"] = bool(subsystem.can_build_meta_human(character=character))
    report["has_high_resolution_textures_before"] = bool(character.has_high_resolution_textures)

    if report["can_build_before"]:
        return

    rig_params = unreal.MetaHumanCharacterAutoRiggingRequestParams()
    rig_params.blocking = True
    rig_params.report_progress = True
    rig_params.rig_type = unreal.MetaHumanRigType.JOINTS_ONLY
    report["requested_auto_rigging"] = True
    subsystem.request_auto_rigging(character=character, params=rig_params)

    texture_params = unreal.MetaHumanCharacterTextureRequestParams()
    texture_params.blocking = True
    texture_params.report_progress = True
    report["requested_texture_sources"] = True
    subsystem.request_texture_sources(character=character, params=texture_params)

    report["can_build_after_requests"] = bool(subsystem.can_build_meta_human(character=character))
    report["has_high_resolution_textures_after_requests"] = bool(character.has_high_resolution_textures)


def main():
    report = {
        "character_path": CHARACTER_PATH,
        "build_path": BUILD_PATH,
        "common_path": COMMON_PATH,
        "requested_auto_rigging": False,
        "requested_texture_sources": False,
        "can_build_before": None,
        "can_build_after_requests": None,
        "has_high_resolution_textures_before": None,
        "has_high_resolution_textures_after_requests": None,
        "built": False,
        "errors": [],
    }

    character = unreal.load_asset(CHARACTER_PATH)
    if not character:
        raise RuntimeError(f"MetaHuman character was not found: {CHARACTER_PATH}")

    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if not subsystem.try_add_object_to_edit(character):
        raise RuntimeError("Unable to edit ChibatenSecretary. Close the MetaHuman editor and run again.")

    try:
        ensure_ready(character, subsystem, report)
        if not subsystem.can_build_meta_human(character=character):
            raise RuntimeError("MetaHuman still cannot be built after preparation.")

        build_params = unreal.MetaHumanCharacterEditorBuildParameters()
        build_params.pipeline_type = unreal.MetaHumanDefaultPipelineType.OPTIMIZED
        build_params.pipeline_quality = unreal.MetaHumanQualityLevel.LOW
        build_params.absolute_build_path = BUILD_PATH
        build_params.common_folder_path = COMMON_PATH
        build_params.name_override = "ChibatenSecretary"
        build_params.enable_wardrobe_item_validation = False

        unreal.log(f"[ChibatenCleanBuild] Building MetaHuman to {BUILD_PATH}/ChibatenSecretary")
        subsystem.build_meta_human(character=character, params=build_params)
        unreal.EditorAssetLibrary.save_directory(BUILD_PATH)
        report["built"] = True
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    unreal.log("[ChibatenCleanBuild] MetaHuman clean-hair build completed.")


if __name__ == "__main__":
    main()
