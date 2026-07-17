from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def set_pose(armature: bpy.types.Object) -> None:
    pose = {
        "J_Bip_L_UpperArm": (0.10, 0.03, -1.08),
        "J_Bip_L_LowerArm": (0.02, 0.05, -0.18),
        "J_Bip_L_Hand": (-0.08, 0.00, 0.04),
        "J_Bip_R_UpperArm": (0.10, -0.03, 1.08),
        "J_Bip_R_LowerArm": (0.02, -0.05, 0.18),
        "J_Bip_R_Hand": (-0.08, 0.00, -0.04),
        "J_Bip_C_Neck": (0.02, 0.00, 0.00),
        "J_Bip_C_Head": (0.03, 0.00, 0.00),
    }
    for bone_name, rotation in pose.items():
        bone = armature.pose.bones.get(bone_name)
        if bone is None:
            continue
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = rotation


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("Usage: blender --background --python blender_render_preview.py -- input.vrm output.png")
    source = Path(sys.argv[-2])
    output = Path(sys.argv[-1])

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.vrm(filepath=str(source))

    armature = next((obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"), None)
    if armature:
        set_pose(armature)

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.resolution_x = 900
    bpy.context.scene.render.resolution_y = 1200
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.world = bpy.data.worlds.new("PreviewWorld")
    bpy.context.scene.world.color = (0.055, 0.065, 0.080)

    key_data = bpy.data.lights.new("Preview Key Light", "AREA")
    key_data.energy = 550
    key_data.size = 4.0
    key = bpy.data.objects.new("Preview Key Light", key_data)
    key.location = (0.5, -2.8, 3.2)
    bpy.context.collection.objects.link(key)

    fill_data = bpy.data.lights.new("Preview Fill Light", "POINT")
    fill_data.energy = 70
    fill = bpy.data.objects.new("Preview Fill Light", fill_data)
    fill.location = (-1.5, -2.0, 1.6)
    bpy.context.collection.objects.link(fill)

    camera_data = bpy.data.cameras.new("Preview Camera")
    camera = bpy.data.objects.new("Preview Camera", camera_data)
    camera.location = (0.0, -3.15, 1.18)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 1.95
    look_at(camera, Vector((0.0, 0.0, 1.12)))
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    print(output)


if __name__ == "__main__":
    main()
