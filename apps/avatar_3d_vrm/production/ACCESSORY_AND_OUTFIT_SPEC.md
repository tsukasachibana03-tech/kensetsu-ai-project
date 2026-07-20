# Accessory And Outfit Spec

This file defines the next production targets for the Chibaten 3D secretary avatar.

## Current Base

- Base app: VRoid Studio
- Current VRM draft: `models/chibaten_field_secretary_accessories_v1.vrm`
- Current look:
  - Chibaten-selected brown hairstyle
  - teal and white field-support jacket texture
  - headset accessory
  - tablet accessory
  - calm standing pose applied in the viewer
  - dark work-style pants
  - black shoes

## Target Direction

Move the model closer to the adopted desktop secretary image:

- friendly construction-office assistant
- teal and white field-support jacket
- black inner shirt
- gray or light work pants
- teal/black work shoes
- headset with microphone
- tablet held or attached as a prop
- small ID card / company badge

## Priority Parts

### 1. Headset

Purpose:
- Make the avatar immediately read as a talking AI secretary.

Target design:
- over-ear headset on one side or both sides
- teal or dark gray earpads
- slim headband
- short microphone boom near mouth

Recommended build:
- Blender accessory mesh
- attach near head bone or export together with the avatar after positioning

Simple shape parts:
- two shallow cylinders for ear cups
- thin curved band
- narrow cylinder for microphone arm
- small sphere/capsule for mic tip

### 2. Tablet

Purpose:
- Match the adopted reference image and show office/construction support.

Target design:
- dark tablet with blue-gray protective case
- small corner guards
- subtle screen reflection

Recommended build:
- Blender mesh or Photoshop texture card
- first version can be a simple rectangular prop

Simple shape parts:
- thin rounded box body
- black screen face
- blue-gray case border
- small raised corner guards

### 3. Field Jacket

Purpose:
- Replace the hoodie feeling with a construction assistant jacket.

Target design:
- teal outer jacket
- white/gray front panels
- black inner layer visible at chest
- pocket lines and zipper line
- small badge on sleeve

Recommended build:
- First pass: VRoid clothing and Photoshop texture editing
- Second pass: Blender mesh additions only if needed

Texture details:
- vertical zipper line at center
- white front panel shapes
- teal sleeves and side panels
- small yellow/gray sleeve badge
- chest ID strap or small card

### 4. Pants And Shoes

Target pants:
- light gray or muted work pants
- slim but practical silhouette
- pocket seams if possible

Target shoes:
- black base
- teal highlights
- thick work-shoe sole

Recommended build:
- VRoid clothing color pass first
- Photoshop/Substance texture pass later

## Suggested Production Order

1. Keep the hairstyle selected by Chibaten.
2. Export the chosen VRM.
3. Open the VRM in Blender.
4. Add headset and tablet as separate accessory meshes.
5. Use Photoshop to make jacket texture details.
6. Re-export VRM.
7. Check in `viewer/index.html`.

## Names

Use these file names for staged outputs:

- `models/chibaten_field_secretary_ponytail.vrm`
- `models/chibaten_field_secretary_hair_final.vrm`
- `models/chibaten_field_secretary_style_v1.vrm`
- `models/chibaten_field_secretary_accessories_v1.vrm`
- `models/chibaten_field_secretary_jacket_v1.vrm`
