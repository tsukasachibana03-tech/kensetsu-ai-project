# Quality Check: Rejected Outfit Proxy

Date: 2026-07-17

Compared files:

- Target reference: `apps/avatar_3d_vrm/production/reference/misato_style_avatar_sheet_latest.png`
- Rejected proxy: `apps/metahuman_unreal/custom_parts/outfit_proxy_v1/chibaten_custom_outfit_proxy_v1_preview.png`

## Result

The proxy is rejected.

## Why It Fails

- It does not look human.
- Body proportions are toy-like and blocky.
- Face has no real facial structure.
- Hair is represented as simple tubes, not realistic hair volume.
- Jacket and dress look like blocks, not cloth.
- Boots are block shapes, not wearable footwear.
- The whole result is far below the adopted MetaHuman/anime-real target.

## Correct Direction

Stop making the full character from simple Blender primitives.

Use MetaHuman as the human base, then add only fitted clothing and accessories:

- red cropped jacket
- black fitted dress/skirt
- boots
- cross necklace
- earrings

The next acceptable preview must show an actual human body/face from MetaHuman or another proper character base.
