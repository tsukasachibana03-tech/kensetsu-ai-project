from __future__ import annotations

import sys

import bpy
from mathutils import Vector


def main() -> None:
    source = sys.argv[-1]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.vrm(filepath=source)

    xs, ys, zs = [], [], []
    for obj in bpy.context.scene.objects:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            xs.append(world.x)
            ys.append(world.y)
            zs.append(world.z)

    print("BOUNDS", min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))
    for obj in bpy.context.scene.objects:
        print("OBJECT", obj.name, obj.type)
        if obj.type == "ARMATURE":
            print("ARMATURE", obj.name)
            for bone in obj.data.bones:
                if any(key in bone.name.lower() for key in ["head", "neck", "hand", "arm", "chest", "hips"]):
                    head = obj.matrix_world @ bone.head_local
                    tail = obj.matrix_world @ bone.tail_local
                    print("BONE", bone.name, "head", tuple(round(v, 4) for v in head), "tail", tuple(round(v, 4) for v in tail))


if __name__ == "__main__":
    main()
