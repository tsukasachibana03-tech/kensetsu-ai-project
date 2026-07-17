# Blender Accessory Steps

Use this after Chibaten finishes choosing the hairstyle in VRoid Studio.

## Input

Start from the selected VRM:

`models/chibaten_field_secretary_hair_final.vrm`

This is the hairstyle-confirmed version selected by Chibaten.

## Goal

Create the first accessory version:

`models/chibaten_field_secretary_accessories_v1.vrm`

## Blender Work

1. Import the VRM.
2. Add a headset accessory:
   - ear cup on the avatar's right or both ears
   - thin band over head
   - microphone boom near mouth
   - colors: dark gray, teal accent, black mic tip
3. Add a tablet accessory:
   - dark tablet body
   - blue-gray protective case
   - black screen
   - small corner guards
4. Position accessories without changing the chosen hairstyle.
5. Parent or attach accessories to the avatar skeleton.
6. Check that head rotation does not separate the headset.
7. Export VRM.

## First Quality Target

The first accessory pass does not need final perfection.

It should confirm:
- headset follows the head
- tablet scale looks natural
- face remains visible
- hair does not clip badly through headset
- model still loads in the local viewer

## Notes

If Blender is not installed, install Blender before this step.
