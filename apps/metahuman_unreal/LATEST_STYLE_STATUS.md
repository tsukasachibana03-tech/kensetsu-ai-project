# Latest Chibaten MetaHuman Style Status

Date: 2026-07-17

Latest adopted reference:

`apps/avatar_3d_vrm/production/reference/misato_style_avatar_sheet_latest.png`

MetaHuman asset:

`/Game/Characters/MetaHumans/ChibatenSecretary`

Applied first pass:

- Long hair with bangs: `WI_Hair_L_StraightBangs`
- Dark purple hair direction
- Soft brown eye direction
- Subtle adult makeup direction
- Temporary black default garment

Custom outfit proxy created:

- Red cropped jacket
- Black fitted dress or skirt style
- Black boots
- Cross necklace
- Earrings

Blender/custom-part outputs:

- `apps/metahuman_unreal/custom_parts/outfit_proxy_v1/chibaten_custom_outfit_proxy_v1.blend`
- `apps/metahuman_unreal/custom_parts/outfit_proxy_v1/chibaten_custom_outfit_proxy_v1.fbx`
- `apps/metahuman_unreal/custom_parts/outfit_proxy_v1/chibaten_custom_outfit_proxy_v1.glb`
- `apps/metahuman_unreal/custom_parts/outfit_proxy_v1/chibaten_custom_outfit_proxy_v1_preview.png`

Unreal imported asset:

`/Game/Chibaten/CustomOutfit/SM_Chibaten_CustomOutfitProxy_v1`

Current quality:

- The first Blender proxy was rejected after comparison with the adopted reference.
- It does not look human and should not be used as the visual direction.
- Stop creating the full character from simple Blender primitives.
- Next step must use MetaHuman as the human base, with only clothing/accessories made separately.

2026-07-17 current progress:

- Epic authentication succeeded as `chibaten`.
- `ChibatenSecretary` auto-rigging succeeded.
- Source face/body textures were downloaded.
- Required MetaHuman render settings were added to `Config/DefaultEngine.ini`.
- `ChibatenSecretary` opens in Unreal's MetaHuman Character editor as a real human MetaHuman base.
- A backup was saved before face/body editing:
  `apps/metahuman_unreal/backups/ChibatenSecretary_backup_before_face_edit_20260717_1630.uasset`

Current blocker:

- The first real MetaHuman assembly has now completed and was saved.
- Generated Unreal assets are under:
  `/Game/MetaHumans/ChibatenSecretary`
- Shared MetaHuman runtime assets are under:
  `/Game/MetaHumans/Common`
- 74 character-specific files were generated under:
  `ChibatenMetaHuman/Content/MetaHumans/ChibatenSecretary`

Current visual issue:

- The assembled MetaHuman is real human-rigged 3D, but it still does not match the adopted reference closely enough.
- The editor preview currently appears gray/dark after assembly. This is likely a preview/material-refresh issue while the generated assets and shaders are being compiled/saved, not proof that the generated asset is unusable.
- Clothing is still temporary. The requested red jacket/black dress direction must be handled as a dedicated clothing/material pass.

Next safe step:

- The generated `/Game/MetaHumans/ChibatenSecretary` actor/blueprint was verified in the main Unreal level.
- A level preview was created and saved:
  `/Game/Chibaten/Preview/L_ChibatenStyledPreview`
- The preview currently uses:
  - real MetaHuman body/face
  - red upper garment material
  - black lower garment material
  - hair hidden temporarily because the assembled StraightBangs groom currently covers the face and renders incorrectly in the level preview

Current visual issue after level preview:

- The body is now visible as a real MetaHuman, not a Blender primitive proxy.
- Clothing color is only a temporary material pass; it is not yet a real red jacket/black dress mesh.
- Hair must be replaced or reassembled with a cleaner style before continuing visual polish.
- Face lighting/skin tone still needs a lookdev pass.

Next safe step:

- Reopen the MetaHuman character asset and replace the current hair with a cleaner style, then reassemble.
- After hair is stable, continue the desktop route:
  1. Unreal-based desktop avatar preview, or
  2. export/convert to a viewer-friendly format such as FBX/glTF/VRM.

Notes:

- This is an original Chibaten secretary avatar direction based on the latest reference sheet.
- The exact copyrighted character should not be recreated.
- Standard MetaHuman clothing does not include the requested red jacket/black dress combination, so clothing/accessories are being created with a custom Blender/Unreal pass.
