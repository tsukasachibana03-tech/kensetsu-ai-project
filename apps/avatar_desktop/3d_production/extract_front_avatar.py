from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_front_avatar.py <reference_sheet.png> <front_crop.png>")
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    output.parent.mkdir(parents=True, exist_ok=True)

    image = Image.open(source).convert("RGBA")
    width, height = image.size

    # The generated reference sheet places the front-view model in the first
    # quarter of the upper production row. The lower row contains expressions.
    left = 0
    top = 0
    right = int(width * 0.245)
    bottom = int(height * 0.825)

    cropped = image.crop((left, top, right, bottom))
    cropped.save(output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
