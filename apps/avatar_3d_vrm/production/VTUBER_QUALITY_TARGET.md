# VTuber Quality Target

Reference:

- YouTube Shorts: `https://www.youtube.com/shorts/zwUlmmj5FrQ`
- Confirmed title: `新衣装をキャンセル(？)する甘結もかｗｗ【ぶいすぽ/甘結もか】`

## Target

Aim for the same general production quality as a modern VTuber model, while keeping the character as Chibaten's original construction-support secretary.

Do not copy the referenced character design. Use it only as a quality benchmark for polish, movement, and presentation.

## Current State

- VRoid base model exists.
- Chibaten-selected hairstyle is fixed.
- Teal and white field-support jacket texture exists.
- Headset and tablet accessories exist.
- Viewer applies a calm standing pose.
- Viewer has stable expression buttons.
- Viewer has blink and simple talking mouth motion.
- Desktop launch batch exists.

Current VRM:

`models/chibaten_field_secretary_accessories_v1.vrm`

## Quality Gaps

### 1. Model Shape

Current model still feels like a VRoid base with added props.

Next targets:

- refine face proportions
- improve eye shine and eyelid shape
- make clothing less hoodie-like and more jacket-like
- improve hands and tablet holding position
- reduce accessory roughness

### 2. Materials And Rendering

Current viewer uses basic lighting.

Next targets:

- toon-style material tuning
- softer face lighting
- stronger eye highlights
- cleaner outlines
- less flat clothing color
- transparent or desktop-friendly background

### 3. Expressions

Current 3D viewer does not yet expose expression switching.

Required expressions:

- normal
- smile
- closed-eye smile
- surprised
- gentle
- talking mouth shapes: A, I, U, E, O
- blink

### 4. Motion

Current motion is static standing pose.

Required motion:

- natural blink
- subtle eye movement
- small head turns
- breathing-like posture shift
- mouth movement during speech

Avoid:

- random shaking
- floating bob motion
- unstable expression switching

### 5. Voice And Lip Sync

Current separate 2D app has simple Japanese speech.

Required for 3D:

- speech button
- chosen voice profile
- mouth opens while speaking
- expression changes while speaking
- later: microphone input and real-time response

### 6. Desktop Experience

Current desktop mode opens the 3D viewer in a window.

Next targets:

- transparent or near-transparent desktop window
- always-on-top option
- right-click menu
- resize and move
- launch shortcut
- auto-start option later

## Recommended Build Order

1. Fix standing pose and tablet placement.
2. Add expression buttons in the viewer.
3. Add blink and mouth movement.
4. Add voice playback to the 3D viewer.
5. Improve lighting and toon rendering.
6. Refine headset/tablet meshes in Blender.
7. Move to a higher-quality desktop runtime if needed.

## Immediate Next Task

Improve model polish: face proportions, eye highlights, accessory detail, jacket shape, and tablet holding pose.
