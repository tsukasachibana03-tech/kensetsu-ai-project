# Chibaten 3D VRM Avatar

This folder is for the true 3D version of the desktop secretary avatar.

## Current Status

The first VRM draft has been created from VRoid Studio.

Current draft:
- female VRoid base
- Chibaten-selected brown hairstyle
- teal and white field-support jacket texture
- headset accessory
- tablet accessory
- viewer-applied natural standing pose
- stable expression buttons
- blink and simple talk mouth motion
- long work-style pants
- black shoes

The existing desktop assistant app is still 2D. This folder contains the true 3D VRM draft and viewer.

## Folder Layout

- `models/`: put the finished `.vrm` model here.
- `production/`: reference notes for making the 3D model.
- `viewer/`: local 3D VRM viewer prototype.

Adobe-specific production notes:

- `production/ADOBE_WORKFLOW.md`
- `production/VTUBER_QUALITY_TARGET.md`

## Target Model Filename

Base model:

`models/chibaten_field_secretary.vrm`

Current hairstyle-confirmed draft:

`models/chibaten_field_secretary_hair_final.vrm`

Current jacket draft:

`models/chibaten_field_secretary_jacket_v1.vrm`

Current accessory draft:

`models/chibaten_field_secretary_accessories_v1.vrm`

Earlier ponytail draft:

`models/chibaten_field_secretary_ponytail.vrm`

## Recommended Production Flow

1. Create the model in VRoid Studio or Blender.
2. Export as VRM.
3. Save the confirmed hairstyle version as `models/chibaten_field_secretary_hair_final.vrm`.
4. Open `viewer/index.html` through the local server.
5. Confirm that the model loads, idles, and is framed correctly.

The local viewer currently auto-loads `models/chibaten_field_secretary_accessories_v1.vrm`.
The viewer applies a calm standing pose at runtime so the avatar does not stay in a T-pose.
The viewer also includes stable expression buttons: Normal, Smile, Soft, Surprise, and Talk.

## Current Local Viewer

The VRM viewer is running from this folder with:

`http://127.0.0.1:8766/viewer/index.html`

Port `8765` may already be used by another local project, so this viewer currently uses `8766`.

## Notes

VRoid Studio is installed and is being used for the base character. Blender 4.5.5 LTS and the VRM format extension are installed for headset/tablet accessory work.
