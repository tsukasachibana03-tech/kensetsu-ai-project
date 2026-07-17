from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


APP_DIR = Path(__file__).resolve().parents[1]
REFERENCE_SHEET = APP_DIR / "3d_production" / "field_support_reference_sheet.png"
BASE_SOURCE = APP_DIR / "assets" / "front_avatar_crop.png"
OUTPUT_DIR = APP_DIR / "assets" / "expressions"


EXPRESSIONS = {
    "normal": (250, 850, 390, 1000),
    "smile": (430, 850, 570, 1000),
    "closed_smile": (615, 850, 755, 1000),
    "surprised": (805, 850, 945, 1000),
    "soft": (995, 850, 1135, 1000),
    "laugh": (1180, 850, 1320, 1000),
}


def remove_light_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            lightness = (r + g + b) / 3
            spread = max(r, g, b) - min(r, g, b)
            if lightness > 238 and spread < 24:
                pixels[x, y] = (255, 255, 255, 0)
            elif lightness > 224 and spread < 32:
                alpha = int(max(0, min(255, (238 - lightness) * 18)))
                pixels[x, y] = (r, g, b, min(a, alpha))

    return image


def harden_transparency(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a < 150:
                pixels[x, y] = (255, 255, 255, 0)
            else:
                pixels[x, y] = (r, g, b, 255)

    return image


def crop_to_subject(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    return image.crop((max(0, left - 16), max(0, top - 16), min(image.width, right + 16), min(image.height, bottom + 16)))


def make_head_patch(reference: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    head = reference.crop(box).convert("RGBA")

    # Keep the central face/head area and fade the edge slightly so it blends
    # into the full-body avatar instead of showing a hard rectangle.
    mask = Image.new("L", head.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((16, 6, head.width - 8, head.height - 2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    head.putalpha(mask)
    return head


def apply_expression(reference: Image.Image, expression_box: tuple[int, int, int, int]) -> Image.Image:
    base = BASE_SOURCE_IMAGE.copy()
    patch = make_head_patch(reference, expression_box)
    patch = patch.resize((178, 190), Image.Resampling.LANCZOS)

    # Position of the adopted character's head on front_avatar_crop.png.
    base.alpha_composite(patch, (82, 18))
    return crop_to_subject(harden_transparency(remove_light_background(base)))


BASE_SOURCE_IMAGE = Image.open(BASE_SOURCE).convert("RGBA")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    reference = Image.open(REFERENCE_SHEET).convert("RGBA")

    for name, box in EXPRESSIONS.items():
        output = OUTPUT_DIR / f"{name}.png"
        variant = apply_expression(reference, box)
        variant.save(output)
        print(output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
