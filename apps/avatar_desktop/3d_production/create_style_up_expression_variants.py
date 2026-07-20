from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


APP_DIR = Path(__file__).resolve().parents[1]
FULL_BODY_SOURCE = APP_DIR / "assets" / "style_up_avatar_source.png"
EXPRESSION_SHEET = APP_DIR / "3d_production" / "style_up_expression_sheet.png"
OUTPUT_DIR = APP_DIR / "assets" / "expressions"
DEFAULT_OUTPUT = APP_DIR / "assets" / "field_support_avatar.png"

NAMES = ["normal", "smile", "closed_smile", "surprised", "soft", "laugh"]


def is_background_candidate(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    lightness = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    return a == 0 or (lightness > 218 and spread < 42)


def remove_border_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if seen[index]:
            return
        seen[index] = 1
        if is_background_candidate(pixels[x, y]):
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                enqueue(nx, ny)

    return image


def harden_transparency(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (255, 255, 255, 0) if a < 120 else (r, g, b, 255)
    return image


def remove_white_boundary(image: Image.Image, passes: int = 2) -> Image.Image:
    image = image.convert("RGBA")

    for _ in range(passes):
        alpha = image.getchannel("A")
        transparent_neighbor = ImageChops.invert(alpha).filter(ImageFilter.MaxFilter(3))
        pixels = image.load()
        neighbor_pixels = transparent_neighbor.load()

        for y in range(image.height):
            for x in range(image.width):
                r, g, b, a = pixels[x, y]
                if a == 0 or neighbor_pixels[x, y] == 0:
                    continue

                lightness = (r + g + b) / 3
                spread = max(r, g, b) - min(r, g, b)

                # Remove only pale, low-saturation pixels touching transparency.
                # This shaves the white background fringe without cutting teal,
                # skin, hair, or dark clothing details.
                if lightness > 206 and spread < 58:
                    pixels[x, y] = (255, 255, 255, 0)

    return image


def contract_alpha(image: Image.Image, passes: int = 1) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    for _ in range(passes):
        alpha = alpha.filter(ImageFilter.MinFilter(3))
    image.putalpha(alpha)
    return image


def crop_to_subject(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    return image.crop((max(0, left - 18), max(0, top - 18), min(image.width, right + 18), min(image.height, bottom + 18)))


def soften_patch_edges(patch: Image.Image) -> Image.Image:
    patch = patch.convert("RGBA")
    alpha = patch.getchannel("A")
    mask = Image.new("L", patch.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((8, 8, patch.width - 8, patch.height - 8), radius=80, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(10))
    patch.putalpha(ImageChops.multiply(alpha, mask))
    return patch


def expression_patch(sheet: Image.Image, index: int) -> Image.Image:
    slot_width = sheet.width // 6
    left = index * slot_width
    right = sheet.width if index == 5 else (index + 1) * slot_width
    slot = sheet.crop((left + 45, 120, min(right, left + 292), 420))
    slot = remove_border_background(slot)
    slot = slot.resize((310, 370), Image.Resampling.LANCZOS)
    return soften_patch_edges(slot)


def make_variant(base: Image.Image, patch: Image.Image | None) -> Image.Image:
    variant = base.copy()
    if patch is not None:
        variant.alpha_composite(patch, (225, 165))
    variant = remove_border_background(variant)
    variant = harden_transparency(variant)
    return crop_to_subject(variant)


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    base = Image.open(FULL_BODY_SOURCE).convert("RGBA")
    sheet = Image.open(EXPRESSION_SHEET).convert("RGBA")

    for index, name in enumerate(NAMES):
        patch = None if index == 0 else expression_patch(sheet, index)
        variant = make_variant(base, patch)
        output = OUTPUT_DIR / f"{name}.png"
        variant.save(output)
        print(output)

    (OUTPUT_DIR / "normal.png").replace(DEFAULT_OUTPUT)
    normal_copy = Image.open(DEFAULT_OUTPUT).convert("RGBA")
    normal_copy.save(OUTPUT_DIR / "normal.png")
    print(DEFAULT_OUTPUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
