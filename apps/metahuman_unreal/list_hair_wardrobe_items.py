import json
from pathlib import Path

import unreal


OUT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\hair_wardrobe_items.json")

asset_registry = unreal.AssetRegistryHelpers.get_asset_registry()
query_paths = [
    "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair",
    "/MetaHumanCharacter/Optional/Grooms",
]

items = []
seen = set()
for query_path in query_paths:
    asset_filter = unreal.ARFilter(
        package_paths=[query_path],
        recursive_paths=True,
        class_paths=[unreal.TopLevelAssetPath("/Script/MetaHumanCharacterPalette", "MetaHumanWardrobeItem")],
    )
    for asset in asset_registry.get_assets(asset_filter):
        package_name = str(asset.package_name)
        if package_name in seen:
            continue
        seen.add(package_name)
        items.append(
            {
                "asset_name": str(asset.asset_name),
                "package_name": package_name,
                "object_path": f"{package_name}.{asset.asset_name}",
            }
        )

items.sort(key=lambda item: item["asset_name"].lower())
OUT.write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")
unreal.log(f"[ChibatenHair] Wrote {len(items)} hair wardrobe items to {OUT}")
