# Chibaten Field Support Secretary - VRM Model Spec

## Goal

Create a VRM-compatible 3D desktop assistant avatar based on the adopted field-support secretary design.

The model should work as a small always-on-top desktop assistant with idle motion, blinking, lip sync, expressions, and future ChatGPT voice integration.

## Character Role

Name: Field Support Secretary

Main use:
- Construction business assistant
- Estimate and quantity takeoff support
- Schedule and document reminders
- Friendly daily conversation

Personality:
- Bright, practical, and reliable
- Friendly but not noisy
- Professional enough for daily office use
- Slightly younger tone than the current Chappy voice
- Natural Japanese with a little soft Okinawan warmth

## Visual Design

Core silhouette:
- Young adult anime-style woman
- Long brown ponytail
- Headset with microphone
- Teal and white construction-office jacket
- Dark inner shirt
- Light gray utility pants
- Teal/black work sneakers
- Tablet in left hand
- Confident hand-on-hip pose

Workplace details:
- ID card
- Utility pockets
- Light safety/workwear accents
- Clean construction-tech look

Do not include:
- Existing anime, manga, game, or brand character resemblance
- Logos or copyrighted marks
- Weapons
- Excessively revealing clothing

## 3D Model Requirements

Format:
- Preferred: VRM 1.0
- Acceptable intermediate: VRM 0.x, FBX, Blender file, or GLB

Style:
- Anime 3D / VRoid-compatible
- Clean cel-shaded or soft toon-shaded materials
- Friendly desktop mascot scale

Rig:
- Humanoid rig
- Head, neck, spine, arms, hands, legs
- Basic hand bones preferred
- Ponytail secondary motion preferred

Face:
- Blink
- Smile
- Neutral
- Surprised
- Thinking
- Talking mouth shapes

Expressions:
- Normal
- Smile
- Work mode
- Notification
- Concerned
- Cheerful

Optimization:
- Suitable for desktop overlay use
- Keep model lightweight
- Texture atlas preferred
- Avoid heavy physics at first

## First Motion Set

Required:
- Idle breathing
- Gentle blink
- Small head turn
- Talking lip movement
- Small greeting bow

Optional:
- Tablet checking motion
- Pointing gesture
- Thinking pose
- Notification gesture

## Desktop Behavior Target

Initial position:
- Lower-right area of the desktop, above the taskbar

Interaction:
- Drag to move
- Right-click menu
- Resize
- Hide/show
- Future: voice input and spoken response

## Production Order

1. Create front, side, and back reference sheet.
2. Create VRoid/Blender base model.
3. Match hair, headset, jacket, pants, shoes, and tablet.
4. Add facial expressions.
5. Export VRM.
6. Connect VRM model to desktop viewer.
7. Add voice/lip sync.
