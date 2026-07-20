import unreal

asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()
queries = {
    "hair": "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair",
    "clothing": "/MetaHumanCharacter/Optional/Clothing",
}
for label, path in queries.items():
    filter = unreal.ARFilter(
        package_paths=[path],
        recursive_paths=True,
        class_paths=[unreal.MetaHumanWardrobeItem.static_class().get_class_path_name()],
    )
    assets = asset_registry.get_assets(filter)
    unreal.log(f"[ChibatenAssets] {label}: {len(assets)}")
    for asset in assets[:80]:
        unreal.log(f"[ChibatenAssets] {label}: {asset.package_name} | {asset.asset_name}")
