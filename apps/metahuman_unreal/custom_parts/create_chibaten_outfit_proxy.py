import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\Dropbox\OPENAI\kensetsu-ai-project\apps\metahuman_unreal\custom_parts")
OUT_DIR = ROOT / "outfit_proxy_v1"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def make_mat(name, color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def add_cube(name, loc, scale, mat, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("soft bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 6
        obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def add_uv_sphere(name, loc, scale, mat, segments=48, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def add_cylinder(name, loc, radius, depth, mat, vertices=48, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def add_cylinder_between(name, start, end, radius, mat, vertices=32):
    start = Vector(start)
    end = Vector(end)
    mid = (start + end) / 2
    direction = end - start
    depth = direction.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def add_torus(name, loc, mat, major=0.18, minor=0.006, scale=(1.0, 0.55, 0.08), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=96, minor_segments=8, location=loc, rotation=rot)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def add_curve_strand(name, points, mat, bevel=0.008):
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 18
    curve.bevel_depth = bevel
    curve.bevel_resolution = 4
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (co[0], co[1], co[2], 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def create_proxy():
    clear_scene()

    skin = make_mat("warm_skin_proxy", (0.86, 0.62, 0.48, 1), 0.48)
    hair = make_mat("deep_purple_hair", (0.065, 0.025, 0.13, 1), 0.42)
    hair_hi = make_mat("purple_hair_highlight", (0.22, 0.12, 0.34, 1), 0.4)
    black = make_mat("fitted_black_dress", (0.005, 0.005, 0.007, 1), 0.62)
    red = make_mat("cropped_red_jacket", (0.55, 0.035, 0.025, 1), 0.5)
    red_dark = make_mat("jacket_dark_panel", (0.24, 0.015, 0.015, 1), 0.55)
    leather = make_mat("black_leather_boots", (0.0, 0.0, 0.0, 1), 0.36)
    silver = make_mat("silver_accessories", (0.72, 0.70, 0.66, 1), 0.22, 0.7)
    belt = make_mat("black_belt", (0.02, 0.015, 0.012, 1), 0.45)
    collar_inner = make_mat("cool_gray_collar_inner", (0.38, 0.42, 0.50, 1), 0.45)

    # Body reference
    add_uv_sphere("head_reference", (0, 0, 1.62), (0.145, 0.12, 0.17), skin)
    add_cylinder("neck_reference", (0, 0, 1.42), 0.045, 0.14, skin)
    add_uv_sphere("torso_under_black_outfit", (0, 0, 1.13), (0.22, 0.13, 0.39), black)
    add_cylinder_between("left_arm_reference", (-0.22, 0, 1.30), (-0.52, 0.03, 0.82), 0.035, skin)
    add_cylinder_between("right_arm_reference", (0.22, 0, 1.30), (0.52, 0.03, 0.82), 0.035, skin)
    add_cylinder_between("left_leg_reference", (-0.09, 0, 0.82), (-0.12, 0, 0.22), 0.055, skin)
    add_cylinder_between("right_leg_reference", (0.09, 0, 0.82), (0.12, 0, 0.22), 0.055, skin)

    # Hair silhouette
    add_uv_sphere("back_hair_mass", (0.0, 0.045, 1.56), (0.19, 0.10, 0.22), hair)
    add_uv_sphere("long_back_hair", (0.0, 0.09, 1.30), (0.18, 0.07, 0.35), hair)
    for i, x in enumerate([-0.13, -0.08, -0.03, 0.03, 0.08, 0.13]):
        add_curve_strand(
            f"soft_front_bang_{i+1}",
            [(x, -0.09, 1.73), (x * 0.55, -0.12, 1.63), (x * 0.35, -0.10, 1.53)],
            hair_hi if i in (1, 4) else hair,
            0.006,
        )
    for i, x in enumerate([-0.16, -0.10, -0.04, 0.04, 0.10, 0.16]):
        add_curve_strand(
            f"wavy_back_hair_{i+1}",
            [(x, 0.06, 1.55), (x * 1.08, 0.08, 1.25), (x * 0.95, 0.06, 0.98)],
            hair,
            0.011,
        )

    # Black high-neck dress
    add_cylinder("black_high_neck", (0, -0.08, 1.39), 0.075, 0.13, black)
    add_uv_sphere("black_fitted_top", (0, -0.035, 1.12), (0.205, 0.108, 0.32), black)
    add_cube("black_front_panel_visible_between_jacket", (0, -0.148, 1.17), (0.23, 0.026, 0.42), black, bevel=0.028)
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.22, radius2=0.15, depth=0.46, location=(0, -0.005, 0.82))
    skirt = bpy.context.object
    skirt.name = "black_fitted_skirt"
    skirt.data.materials.append(black)
    bpy.ops.object.shade_smooth()
    add_cube("small_front_slit", (0.0, -0.115, 0.70), (0.035, 0.012, 0.14), skin, bevel=0.003)

    # Cropped red jacket body and collar
    add_cube("red_jacket_back_panel", (0, 0.055, 1.20), (0.46, 0.032, 0.34), red, bevel=0.018)
    add_cube("red_jacket_left_front_panel", (-0.145, -0.084, 1.20), (0.155, 0.030, 0.34), red, bevel=0.018, rot=(0, 0, math.radians(-5)))
    add_cube("red_jacket_right_front_panel", (0.145, -0.084, 1.20), (0.155, 0.030, 0.34), red, bevel=0.018, rot=(0, 0, math.radians(5)))
    add_cube("left_jacket_dark_trim", (-0.02, -0.105, 1.20), (0.018, 0.018, 0.34), red_dark, bevel=0.004, rot=(0, 0, math.radians(-8)))
    add_cube("right_jacket_dark_trim", (0.02, -0.105, 1.20), (0.018, 0.018, 0.34), red_dark, bevel=0.004, rot=(0, 0, math.radians(8)))
    add_cube("left_raised_collar", (-0.095, -0.035, 1.43), (0.15, 0.035, 0.13), red, bevel=0.014, rot=(math.radians(8), math.radians(-15), math.radians(-17)))
    add_cube("right_raised_collar", (0.095, -0.035, 1.43), (0.15, 0.035, 0.13), red, bevel=0.014, rot=(math.radians(8), math.radians(15), math.radians(17)))
    add_cube("collar_inner_hint", (0, -0.065, 1.41), (0.20, 0.018, 0.09), collar_inner, bevel=0.006)
    add_cylinder_between("left_red_sleeve", (-0.225, -0.002, 1.29), (-0.505, 0.025, 0.89), 0.055, red)
    add_cylinder_between("right_red_sleeve", (0.225, -0.002, 1.29), (0.505, 0.025, 0.89), 0.055, red)
    add_cylinder_between("left_black_cuff", (-0.49, 0.024, 0.91), (-0.56, 0.03, 0.80), 0.046, black)
    add_cylinder_between("right_black_cuff", (0.49, 0.024, 0.91), (0.56, 0.03, 0.80), 0.046, black)

    # Belt, boots, and simple patch.
    add_cube("black_belt_body", (0, -0.12, 0.93), (0.47, 0.025, 0.035), belt, bevel=0.006)
    add_cube("silver_belt_buckle", (0, -0.142, 0.93), (0.065, 0.014, 0.052), silver, bevel=0.004)
    add_cylinder_between("left_boot_shaft", (-0.12, 0.0, 0.46), (-0.12, 0.0, 0.17), 0.072, leather)
    add_cylinder_between("right_boot_shaft", (0.12, 0.0, 0.46), (0.12, 0.0, 0.17), 0.072, leather)
    add_cube("left_boot_foot", (-0.12, -0.07, 0.07), (0.13, 0.25, 0.08), leather, bevel=0.025)
    add_cube("right_boot_foot", (0.12, -0.07, 0.07), (0.13, 0.25, 0.08), leather, bevel=0.025)
    add_cube("left_sleeve_patch", (-0.32, -0.045, 1.13), (0.055, 0.011, 0.072), red_dark, bevel=0.004, rot=(0, math.radians(8), math.radians(-13)))

    # Accessories
    add_torus("silver_neck_chain", (0, -0.073, 1.385), silver, major=0.142, minor=0.0038, scale=(1.0, 0.45, 0.06), rot=(math.radians(82), 0, 0))
    add_cube("cross_vertical", (0, -0.163, 1.275), (0.026, 0.010, 0.105), silver, bevel=0.003)
    add_cube("cross_horizontal", (0, -0.168, 1.295), (0.078, 0.010, 0.024), silver, bevel=0.003)
    add_uv_sphere("left_silver_earring", (-0.145, -0.02, 1.60), (0.015, 0.015, 0.015), silver, 24, 12)
    add_uv_sphere("right_silver_earring", (0.145, -0.02, 1.60), (0.015, 0.015, 0.015), silver, 24, 12)

    # Face hints
    add_uv_sphere("left_eye_hint", (-0.052, -0.108, 1.64), (0.018, 0.006, 0.012), make_mat("soft_brown_eye", (0.24, 0.12, 0.05, 1), 0.3), 24, 12)
    add_uv_sphere("right_eye_hint", (0.052, -0.108, 1.64), (0.018, 0.006, 0.012), bpy.data.materials["soft_brown_eye"], 24, 12)
    add_cube("small_smile_hint", (0, -0.118, 1.57), (0.065, 0.005, 0.010), make_mat("soft_lip_color", (0.35, 0.10, 0.08, 1), 0.45), bevel=0.004)

    # Lighting and camera
    bpy.ops.object.light_add(type="AREA", location=(0, -3, 3.1))
    key = bpy.context.object
    key.name = "large_softbox_key_light"
    key.data.energy = 650
    key.data.size = 4.0
    bpy.ops.object.light_add(type="POINT", location=(-2.0, 1.4, 2.0))
    rim = bpy.context.object
    rim.name = "purple_rim_light"
    rim.data.energy = 65
    rim.data.color = (0.45, 0.25, 0.90)

    bpy.ops.object.camera_add(location=(0, -4.0, 0.95), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 2.15
    bpy.context.scene.camera = camera

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.resolution_x = 1400
    bpy.context.scene.render.resolution_y = 1800
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.world.color = (0.045, 0.045, 0.055)

    blend_path = OUT_DIR / "chibaten_custom_outfit_proxy_v1.blend"
    glb_path = OUT_DIR / "chibaten_custom_outfit_proxy_v1.glb"
    fbx_path = OUT_DIR / "chibaten_custom_outfit_proxy_v1.fbx"
    png_path = OUT_DIR / "chibaten_custom_outfit_proxy_v1_preview.png"

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB")
    bpy.ops.export_scene.fbx(filepath=str(fbx_path), apply_scale_options="FBX_SCALE_ALL")
    bpy.context.scene.render.filepath = str(png_path)
    bpy.ops.render.render(write_still=True)

    print(f"[ChibatenOutfitProxy] blend={blend_path}")
    print(f"[ChibatenOutfitProxy] glb={glb_path}")
    print(f"[ChibatenOutfitProxy] fbx={fbx_path}")
    print(f"[ChibatenOutfitProxy] preview={png_path}")


if __name__ == "__main__":
    create_proxy()
