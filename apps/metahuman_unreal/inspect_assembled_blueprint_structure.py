import json
from pathlib import Path

import unreal


BP_PATHS = [
    "/Game/MetaHumans/ChibatenSecretary/BP_ChibatenSecretary",
    "/Game/MetaHumans/ChibatenSecretary/BP_ChibatenSecretary_StyledPreview",
]
OUT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\assembled_blueprint_structure.json")


def public_names(obj):
    return [name for name in dir(obj) if not name.startswith("_")]


def safe_call(label, func):
    try:
        return {"ok": True, "value": func()}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


data = {
    "subobject_data_subsystem_dir": safe_call(
        "subobject_data_subsystem_dir",
        lambda: public_names(unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)),
    ),
    "blueprints": [],
}

for bp_path in BP_PATHS:
    bp_asset = unreal.load_asset(bp_path)
    bp_class = unreal.EditorAssetLibrary.load_blueprint_class(bp_path)
    entry = {
        "path": bp_path,
        "asset_class": str(bp_asset.get_class().get_name()) if bp_asset else None,
        "class": str(bp_class.get_name()) if bp_class else None,
        "asset_dir_sample": public_names(bp_asset)[:200] if bp_asset else [],
        "class_dir_sample": public_names(bp_class)[:200] if bp_class else [],
        "cdo_components": [],
        "subobjects": [],
    }

    if bp_class:
        cdo = unreal.get_default_object(bp_class)
        entry["cdo_name"] = str(cdo.get_name())
        entry["cdo_class"] = str(cdo.get_class().get_name())
        entry["cdo_dir_sample"] = public_names(cdo)[:200]
        for cls in [
            unreal.ActorComponent,
            unreal.SceneComponent,
            unreal.SkeletalMeshComponent,
            unreal.StaticMeshComponent,
            unreal.GroomComponent,
        ]:
            entry["cdo_components"].append(
                safe_call(
                    str(cls),
                    lambda cls=cls: [
                        {
                            "name": str(comp.get_name()),
                            "class": str(comp.get_class().get_name()),
                            "num_materials": comp.get_num_materials()
                            if hasattr(comp, "get_num_materials")
                            else None,
                        }
                        for comp in cdo.get_components_by_class(cls)
                    ],
                )
            )

    try:
        subsystem = unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)
        handles = subsystem.k2_gather_subobject_data_for_blueprint(context=bp_asset)
        entry["subobject_handle_count"] = len(handles)
        entry["subobject_handle_dir_sample"] = public_names(handles[0])[:120] if handles else []
        if handles:
            first_data_obj = subsystem.k2_find_subobject_data_from_handle(handles[0])
            entry["subobject_data_dir_sample"] = public_names(first_data_obj)[:160]
            entry["subobject_data_first_properties"] = safe_call(
                "first_data_dict", lambda: first_data_obj.to_dict()
            )
        for handle in handles:
            data_obj = subsystem.k2_find_subobject_data_from_handle(handle)
            component_template = data_obj.get_object_for_blueprint(bp_asset)
            item = {
                "display_string": str(data_obj.get_display_string()),
                "variable_name": str(data_obj.get_variable_name()),
                "object_name": str(component_template.get_name())
                if component_template
                else None,
                "object_class": str(component_template.get_class().get_name())
                if component_template
                else None,
            }
            if component_template and hasattr(component_template, "get_num_materials"):
                item["num_materials"] = component_template.get_num_materials()
                if hasattr(component_template, "get_material_slot_names"):
                    item["slot_names"] = [
                        str(name) for name in component_template.get_material_slot_names()
                    ]
            entry["subobjects"].append(item)
    except Exception as exc:
        entry["subobject_error"] = str(exc)

    data["blueprints"].append(entry)

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
unreal.log(f"[ChibatenInspect] Wrote {OUT}")
