# Desktop Avatar Prototype

This folder contains the first desktop avatar prototype for the adopted field-support assistant design.

## Controls

- Drag the avatar to move it.
- Right-click to change expression, play voice lines, resize, or close it.
- Expression shortcuts: `1` normal, `2` smile, `3` closed smile, `4` surprised, `5` soft, `6` laugh.
- Voice shortcut: `v` plays a voice test.
- Double-click or press `Esc` to close it.

## Files

- `assets/source_adopted_avatar.png`: the original adopted image.
- `assets/style_up_avatar_source.png`: the upgraded style source image.
- `assets/style_up_avatar_source_green.png`: chroma-key source used to remove the white edge.
- `assets/style_up_avatar_source_whitebg.png`: previous white-background style source backup.
- `assets/field_support_avatar.png`: the prepared transparent avatar image.
- `assets/expressions/`: expression variants used by the desktop menu.
- `assets/expressions_previous/`: previous expression variant backup.
- `avatar_desktop.py`: the desktop overlay app.

## Voice

The prototype uses the Windows Japanese desktop voice when available.

Voice menu:
- Greeting
- Start work
- Confirmed
- Break
- Voice test
- Speak custom text

Motion menu:
- Natural: fixed-position stable expression switching.
- Gentle: same fixed-position stable switching.
- Stop: fixed display with no automatic expression changes.
- Shortcut: `m` toggles motion on/off.
