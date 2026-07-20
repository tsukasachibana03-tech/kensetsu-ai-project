import json
from pathlib import Path

import unreal


OUT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\material_parameter_inspect.json")

MATERIAL_PATHS = [
    "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair.MI_WI_Hair_L_StraightBangs_Hair",
    "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair_Cards.MI_WI_Hair_L_StraightBangs_Hair_Cards",
    "/Game/MetaHumans/ChibatenSecretary/Grooms/MI_WI_Hair_L_StraightBangs_Hair_Helmet.MI_WI_Hair_L_StraightBangs_Hair_Helmet",
    "/Game/MetaHumans/ChibatenSecretary/Clothing/MI_WI_DefaultGarment_M_DG_bodyShapeE_Shirt.MI_WI_DefaultGarment_M_DG_bodyShapeE_Shirt",
    "/Game/MetaHumans/ChibatenSecretary/Clothing/MI_WI_DefaultGarment_M_DG_bodyShapeE_Short.MI_WI_DefaultGarment_M_DG_bodyShapeE_Short",
    "/Game/MetaHumans/ChibatenSecretary/Face/Materials/MI_Face_Skin_Baked_LOD0.MI_Face_Skin_Baked_LOD0",
]


def names_for(material, func_name):
    func = getattr(unreal.MaterialEditingLibrary, func_name, None)
    if not func:
        return []
    try:
        return [str(name) for name in func(material)]
    except Exception as exc:
        return [f"ERROR: {exc}"]


data = {}
for path in MATERIAL_PATHS:
    material = unreal.load_asset(path)
    entry = {
        "exists": bool(material),
        "class": str(material.get_class().get_name()) if material else None,
    }
    if material:
        entry["scalar"] = names_for(material, "get_scalar_parameter_names")
        entry["vector"] = names_for(material, "get_vector_parameter_names")
        entry["texture"] = names_for(material, "get_texture_parameter_names")
        entry["static_switch"] = names_for(material, "get_static_switch_parameter_names")
    data[path] = entry

OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
unreal.log(f"[ChibatenInspect] Wrote {OUT}")
