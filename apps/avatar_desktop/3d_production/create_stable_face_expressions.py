from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


APP_DIR = Path(__file__).resolve().parents[1]
BASE_IMAGE = APP_DIR / "assets" / "field_support_avatar.png"
OUTPUT_DIR = APP_DIR / "assets" / "expressions"
PREVIEW = APP_DIR / "3d_production" / "stable_expression_preview.jpg"

FACE = {
    "left_eye": (270, 165),
    "right_eye": (337, 163),
    "mouth": (314, 218),
}


def draw_curve(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill: tuple[int, int, int, int], width: int) -> None:
    if len(points) < 2:
        return
    draw.line(points, fill=fill, width=width, joint="curve")


def quadratic_curve(start: tuple[int, int], control: tuple[int, int], end: tuple[int, int], steps: int = 24) -> list[tuple[int, int]]:
    points = []
    for index in range(steps + 1):
        t = index / steps
        x = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t**2 * end[0]
        y = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t**2 * end[1]
        points.append((round(x), round(y)))
    return points


def make_overlay(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGBA", size, (255, 255, 255, 0))


def add_blush(overlay: Image.Image, strength: int = 45) -> None:
    blush = Image.new("RGBA", overlay.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(blush)
    draw.ellipse((252, 188, 292, 215), fill=(255, 132, 132, strength))
    draw.ellipse((342, 186, 385, 214), fill=(255, 132, 132, strength))
    blush = blush.filter(ImageFilter.GaussianBlur(8))
    overlay.alpha_composite(blush)


def cover_eye(overlay: Image.Image, center: tuple[int, int], side: str) -> None:
    draw = ImageDraw.Draw(overlay)
    x, y = center
    fill = (249, 202, 185, 235)
    if side == "left":
        draw.ellipse((x - 28, y - 17, x + 30, y + 17), fill=fill)
    else:
        draw.ellipse((x - 29, y - 17, x + 29, y + 17), fill=fill)


def draw_closed_eye(overlay: Image.Image, center: tuple[int, int], side: str) -> None:
    cover_eye(overlay, center, side)
    draw = ImageDraw.Draw(overlay)
    x, y = center
    line = (78, 42, 34, 245)
    if side == "left":
        points = quadratic_curve((x - 24, y - 2), (x, y + 12), (x + 25, y - 1))
    else:
        points = quadratic_curve((x - 25, y - 2), (x, y + 12), (x + 24, y - 1))
    draw_curve(draw, points, line, 4)


def draw_smile_mouth(overlay: Image.Image, open_mouth: bool = False, laugh: bool = False) -> None:
    draw = ImageDraw.Draw(overlay)
    x, y = FACE["mouth"]
    mouth_line = (104, 44, 45, 245)
    if open_mouth:
        draw.ellipse((x - 12, y - 1, x + 17, y + 20), fill=(83, 36, 42, 230))
        draw.arc((x - 14, y - 2, x + 18, y + 20), start=0, end=180, fill=(136, 65, 68, 230), width=3)
    elif laugh:
        draw.ellipse((x - 15, y - 2, x + 20, y + 22), fill=(78, 33, 39, 235))
        draw.arc((x - 17, y - 3, x + 22, y + 21), start=0, end=180, fill=(147, 68, 70, 235), width=3)
    else:
        points = quadratic_curve((x - 25, y + 5), (x - 1, y + 17), (x + 25, y + 2))
        draw_curve(draw, points, mouth_line, 4)


def draw_surprised_mouth(overlay: Image.Image) -> None:
    draw = ImageDraw.Draw(overlay)
    x, y = FACE["mouth"]
    draw.ellipse((x - 7, y - 2, x + 10, y + 18), fill=(70, 31, 39, 240))
    draw.ellipse((x - 3, y + 2, x + 6, y + 10), fill=(155, 76, 79, 170))


def build_expression(base: Image.Image, name: str) -> Image.Image:
    image = base.copy()
    overlay = make_overlay(image.size)

    if name == "normal":
        return image
    if name == "smile":
        add_blush(overlay, 36)
        draw_smile_mouth(overlay, open_mouth=False)
    elif name == "closed_smile":
        add_blush(overlay, 50)
        draw_closed_eye(overlay, FACE["left_eye"], "left")
        draw_closed_eye(overlay, FACE["right_eye"], "right")
        draw_smile_mouth(overlay, open_mouth=False)
    elif name == "surprised":
        add_blush(overlay, 22)
        draw_surprised_mouth(overlay)
    elif name == "soft":
        add_blush(overlay, 28)
        draw_smile_mouth(overlay, open_mouth=False)
    elif name == "laugh":
        add_blush(overlay, 55)
        draw_closed_eye(overlay, FACE["left_eye"], "left")
        draw_closed_eye(overlay, FACE["right_eye"], "right")
        draw_smile_mouth(overlay, laugh=True)

    image.alpha_composite(overlay)
    return image


def save_preview(names: list[str]) -> None:
    thumbs = []
    for name in names:
        image = Image.open(OUTPUT_DIR / f"{name}.png").convert("RGBA")
        image.thumbnail((150, 420), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (170, 455), (255, 255, 255, 255))
        canvas.alpha_composite(image, ((170 - image.width) // 2, 0))
        ImageDraw.Draw(canvas).text((10, 430), name, fill=(0, 0, 0))
        thumbs.append(canvas)

    preview = Image.new("RGBA", (170 * len(thumbs), 455), (255, 255, 255, 255))
    for index, thumb in enumerate(thumbs):
        preview.alpha_composite(thumb, (index * 170, 0))
    preview.convert("RGB").save(PREVIEW)


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    base = Image.open(BASE_IMAGE).convert("RGBA")
    names = ["normal", "smile", "closed_smile", "surprised", "soft", "laugh"]
    for name in names:
        output = OUTPUT_DIR / f"{name}.png"
        build_expression(base, name).save(output)
        print(output)
    save_preview(names)
    print(PREVIEW)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
