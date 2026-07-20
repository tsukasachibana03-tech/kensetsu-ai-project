from pathlib import Path

from PIL import Image, ImageDraw


NAMES = ["normal", "smile", "closed_smile", "surprised", "soft", "laugh"]
APP_DIR = Path(__file__).resolve().parents[1]
EXPRESSION_DIR = APP_DIR / "assets" / "expressions"
OUTPUT = APP_DIR / "3d_production" / "expression_variants_preview.jpg"


thumbs = []
for name in NAMES:
    image = Image.open(EXPRESSION_DIR / f"{name}.png").convert("RGBA")
    image.thumbnail((150, 360))

    canvas = Image.new("RGBA", (170, 400), (255, 255, 255, 255))
    canvas.alpha_composite(image, ((170 - image.width) // 2, 0))
    ImageDraw.Draw(canvas).text((10, 370), name, fill=(0, 0, 0))
    thumbs.append(canvas)

out = Image.new("RGBA", (170 * len(thumbs), 400), (255, 255, 255, 255))
for index, thumb in enumerate(thumbs):
    out.alpha_composite(thumb, (index * 170, 0))

out.convert("RGB").save(OUTPUT)
print(OUTPUT)
