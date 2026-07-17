# Adobe-Based 3D Avatar Workflow

## What Adobe Can Do

Adobe tools are useful for the visual production stage.

Recommended use:

- Photoshop: character reference sheet, texture cleanup, outfit details, decals, ID card, color corrections.
- Illustrator: clean logos or vector-style outfit details if needed.
- Substance 3D Modeler: sculpt or assemble custom 3D accessories such as headset, tablet, jacket parts, shoes, and utility pockets.
- Substance 3D Painter: paint textures for the model, including jacket material, cloth folds, shoes, headset, tablet, and ID card.
- Substance 3D Sampler/Designer: create fabric, plastic, rubber, and metal materials.
- Substance 3D Stager: preview lighting and render quality.
- Mixamo: useful for some FBX rigging and animation checks, but not a direct VRM final step.
- Character Animator: useful for a 2D puppet version, but not the final true 3D VRM avatar.

## Important Limitation

Adobe tools do not normally export a finished VRM avatar directly.

For the desktop 3D assistant, the final model should become:

`models/chibaten_field_secretary.vrm`

That final conversion will usually need one of these:

- Blender with a VRM add-on
- Unity with UniVRM
- VRoid Studio export

## Recommended Practical Pipeline

1. Use Photoshop to finalize the character reference.
2. Use Substance 3D Modeler or another 3D tool to build accessories:
   - headset
   - tablet
   - work jacket details
   - utility pockets
   - shoes
3. Use Substance 3D Painter to paint the textures.
4. Export the model or parts as FBX, OBJ, GLB, or USD.
5. Bring the model into Blender or Unity.
6. Rig as humanoid and add expressions.
7. Export as VRM.
8. Save as:

   `F:\Dropbox\OPENAI\kensetsu-ai-project\apps\avatar_3d_vrm\models\chibaten_field_secretary.vrm`

9. Test in:

   `F:\Dropbox\OPENAI\kensetsu-ai-project\apps\avatar_3d_vrm\viewer\index.html`

## Best Route For Chibaten

For speed:

Photoshop reference -> VRoid Studio base model -> Substance Painter textures -> VRM export

For quality:

Photoshop reference -> Substance/Blender custom model -> Blender/Unity rig -> VRM export

## Local Check

Detected locally so far:

- Adobe Photoshop 2025
- Adobe Photoshop 2026
- Adobe Creative Cloud
- Acrobat DC

Not detected locally yet:

- Substance 3D Modeler
- Substance 3D Painter
- Substance 3D Stager
- Adobe Character Animator
- Blender
- VRoid Studio
