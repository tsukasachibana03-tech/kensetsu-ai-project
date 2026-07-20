from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def remove_light_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lightness = (r + g + b) / 3
            color_spread = max(r, g, b) - min(r, g, b)

            if lightness > 238 and color_spread < 24:
                pixels[x, y] = (255, 255, 255, 0)
            elif lightness > 224 and color_spread < 32:
                alpha = int(max(0, min(255, (238 - lightness) * 18)))
                pixels[x, y] = (r, g, b, min(a, alpha))

    return image


def crop_to_subject(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return image

    left, top, right, bottom = bbox
    pad_x = 16
    pad_y = 16
    left = max(0, left - pad_x)
    top = max(0, top - pad_y)
    right = min(image.width, right + pad_x)
    bottom = min(image.height, bottom + pad_y)
    return image.crop((left, top, right, bottom))


def harden_transparency(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < 150:
                pixels[x, y] = (255, 255, 255, 0)
            else:
                pixels[x, y] = (r, g, b, 255)

    return image


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: prepare_avatar_asset.py <source.png> <output.png>")
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)

    image = Image.open(source)
    image = remove_light_background(image)
    image = harden_transparency(image)
    image = crop_to_subject(image)
    image.save(output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
