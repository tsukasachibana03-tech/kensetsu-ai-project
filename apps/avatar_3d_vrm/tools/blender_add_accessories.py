from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


TEAL = (0.10, 0.55, 0.60, 1.0)
DARK = (0.02, 0.025, 0.03, 1.0)
SOFT_DARK = (0.10, 0.14, 0.16, 1.0)
SCREEN = (0.005, 0.008, 0.012, 1.0)
TABLET_CASE = (0.12, 0.25, 0.31, 1.0)


def material(name: str, color: tuple[float, float, float, float]) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.82
        bsdf.inputs["Metallic"].default_value = 0.0
    return mat


def bind_to_bone(obj: bpy.types.Object, armature: bpy.types.Object, bone_name: str) -> None:
    obj.parent = armature
    obj.matrix_parent_inverse = armature.matrix_world.inverted()
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "ADD")
    modifier = obj.modifiers.new("Armature", "ARMATURE")
    modifier.object = armature


def cylinder_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    mat: bpy.types.Material,
    armature: bpy.types.Object,
    bone_name: str,
    vertices: int = 16,
) -> bpy.types.Object:
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    midpoint = start_v + direction * 0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    obj.data.materials.append(mat)
    bind_to_bone(obj, armature, bone_name)
    return obj


def add_cube(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    mat: bpy.types.Material,
    armature: bpy.types.Object,
    bone_name: str,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    bind_to_bone(obj, armature, bone_name)
    return obj


def add_earcup(
    name: str,
    x: float,
    y: float,
    z: float,
    mat: bpy.types.Material,
    accent_mat: bpy.types.Material,
    armature: bpy.types.Object,
) -> None:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.040,
        depth=0.030,
        location=(x, y, z),
        rotation=(0, math.radians(90), 0),
    )
    cup = bpy.context.object
    cup.name = name
    cup.data.materials.append(mat)
    bind_to_bone(cup, armature, "J_Bip_C_Head")

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.031,
        depth=0.032,
        location=(x + (0.002 if x < 0 else -0.002), y - 0.001, z),
        rotation=(0, math.radians(90), 0),
    )
    accent = bpy.context.object
    accent.name = f"{name}_teal_accent"
    accent.data.materials.append(accent_mat)
    bind_to_bone(accent, armature, "J_Bip_C_Head")


def add_headset(armature: bpy.types.Object) -> None:
    dark = material("accessory_headset_dark", SOFT_DARK)
    teal = material("accessory_headset_teal", TEAL)

    left = (0.118, -0.032, 1.435)
    right = (-0.118, -0.032, 1.435)
    add_earcup("headset_left_earcup", *left, dark, teal, armature)
    add_earcup("headset_right_earcup", *right, dark, teal, armature)

    arch_points = []
    for index in range(9):
        t = index / 8
        x = -0.118 + (0.236 * t)
        z = 1.454 + math.sin(math.pi * t) * 0.122
        arch_points.append((x, -0.035, z))
    for index, (start, end) in enumerate(zip(arch_points, arch_points[1:])):
        cylinder_between(f"headset_headband_{index:02d}", start, end, 0.0065, dark, armature, "J_Bip_C_Head", 12)

    mic_points = [
        (-0.118, -0.045, 1.418),
        (-0.100, -0.070, 1.402),
        (-0.070, -0.095, 1.392),
        (-0.038, -0.112, 1.386),
    ]
    for index, (start, end) in enumerate(zip(mic_points, mic_points[1:])):
        cylinder_between(f"headset_mic_boom_{index:02d}", start, end, 0.0048, dark, armature, "J_Bip_C_Head", 12)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.012, location=mic_points[-1])
    tip = bpy.context.object
    tip.name = "headset_mic_tip"
    tip.scale.y = 0.65
    tip.data.materials.append(dark)
    bind_to_bone(tip, armature, "J_Bip_C_Head")


def add_tablet(armature: bpy.types.Object) -> None:
    case = material("accessory_tablet_case", TABLET_CASE)
    screen = material("accessory_tablet_screen", SCREEN)
    grip = material("accessory_tablet_corner_guards", DARK)

    # Placed near the avatar's left hand in the current T-pose. It will follow the hand bone.
    add_cube("tablet_case", (0.565, -0.122, 1.160), (0.175, 0.018, 0.245), case, armature, "J_Bip_L_Hand")
    add_cube("tablet_screen", (0.565, -0.133, 1.160), (0.140, 0.006, 0.205), screen, armature, "J_Bip_L_Hand")

    for index, (dx, dz) in enumerate([(-0.075, -0.105), (0.075, -0.105), (-0.075, 0.105), (0.075, 0.105)]):
        add_cube(
            f"tablet_corner_guard_{index}",
            (0.565 + dx, -0.137, 1.160 + dz),
            (0.028, 0.010, 0.028),
            grip,
            armature,
            "J_Bip_L_Hand",
        )


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("Usage: blender --background --python blender_add_accessories.py -- input.vrm output.vrm")
    source = Path(sys.argv[-2])
    output = Path(sys.argv[-1])

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.vrm(filepath=str(source))

    armature = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"), None)
    if armature is None:
        raise RuntimeError("No armature found after importing VRM")

    add_headset(armature)
    add_tablet(armature)

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = armature
    bpy.ops.export_scene.vrm(filepath=str(output))
    print(output)


if __name__ == "__main__":
    main()
