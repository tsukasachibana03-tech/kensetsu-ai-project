import unreal

FBX_PATH = r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\custom_parts\outfit_proxy_v1\chibaten_custom_outfit_proxy_v1.fbx"
DESTINATION_PATH = "/Game/Chibaten/CustomOutfit"


def import_proxy():
    unreal.EditorAssetLibrary.make_directory(DESTINATION_PATH)

    options = unreal.FbxImportUI()
    options.import_mesh = True
    options.import_as_skeletal = False
    options.import_materials = True
    options.import_textures = False
    options.create_physics_asset = False

    if options.static_mesh_import_data:
        options.static_mesh_import_data.combine_meshes = True
        options.static_mesh_import_data.generate_lightmap_u_vs = True
        options.static_mesh_import_data.auto_generate_collision = True

    task = unreal.AssetImportTask()
    task.filename = FBX_PATH
    task.destination_path = DESTINATION_PATH
    task.destination_name = "SM_Chibaten_CustomOutfitProxy_v1"
    task.automated = True
    task.replace_existing = True
    task.save = True
    task.options = options

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    if task.imported_object_paths:
        for asset_path in task.imported_object_paths:
            unreal.log(f"[ChibatenOutfitImport] Imported: {asset_path}")
    else:
        raise RuntimeError("No assets were imported.")

    unreal.EditorAssetLibrary.save_directory(DESTINATION_PATH)
    unreal.log("[ChibatenOutfitImport] Custom outfit proxy imported into Unreal.")


if __name__ == "__main__":
    import_proxy()
