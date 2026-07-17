from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageFilter


def remove_green(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            green_strength = g - max(r, b)

            if g > 150 and green_strength > 45:
                pixels[x, y] = (255, 255, 255, 0)
            elif g > 120 and green_strength > 28:
                alpha = int(max(0, min(255, 255 - green_strength * 5)))
                pixels[x, y] = (r, g, b, min(a, alpha))

    return image


def contract_alpha(image: Image.Image, passes: int = 1) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    for _ in range(passes):
        alpha = alpha.filter(ImageFilter.MinFilter(3))
    image.putalpha(alpha)
    return image


def harden_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a < 120:
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
    return image.crop((max(0, left - 8), max(0, top - 8), min(image.width, right + 8), min(image.height, bottom + 8)))


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: remove_green_chroma.py <input.png> <output.png>")
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)

    image = Image.open(source)
    image = remove_green(image)
    image = contract_alpha(image, passes=1)
    image = harden_alpha(image)
    image = crop_to_subject(image)
    image.save(output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
