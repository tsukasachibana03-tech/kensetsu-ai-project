import unreal

ASSET_DIR = "/Game/Characters/MetaHumans"
ASSET_NAME = "ChibatenSecretary"
ASSET_PATH = f"{ASSET_DIR}/{ASSET_NAME}"


def main():
    unreal.EditorAssetLibrary.make_directory(ASSET_DIR)

    if unreal.EditorAssetLibrary.does_asset_exist(ASSET_PATH):
        existing = unreal.EditorAssetLibrary.load_asset(ASSET_PATH)
        unreal.log(f"[Chibaten] MetaHuman Character already exists: {ASSET_PATH}")
        if existing:
            unreal.EditorAssetLibrary.save_loaded_asset(existing)
        return

    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    character = asset_tools.create_asset(
        asset_name=ASSET_NAME,
        package_path=ASSET_DIR,
        asset_class=unreal.MetaHumanCharacter,
        factory=unreal.new_object(type=unreal.MetaHumanCharacterFactoryNew),
    )

    if not character:
        unreal.log_error(f"[Chibaten] Failed to create MetaHuman Character: {ASSET_PATH}")
        raise RuntimeError("Failed to create MetaHuman Character")

    unreal.EditorAssetLibrary.save_loaded_asset(character)
    unreal.log(f"[Chibaten] Created MetaHuman Character: {ASSET_PATH}")


if __name__ == "__main__":
    main()
