#!/usr/bin/env python3
"""Generate Chrome Web Store upload-ready images from IMDBPlay screenshots."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "docs" / "screenshots"
ICONS = ROOT / "icons"
OUT = ROOT / "docs" / "store-assets"

BG = (18, 18, 18)  # #121212 — IMDb dark UI
YELLOW = (245, 197, 24)  # IMDb-style accent
WHITE = (255, 255, 255)
GRAY = (180, 180, 180)

SCREENSHOT_JOBS = [
    ("title-page.png", "screenshot-1-title-page.png"),
    ("homepage-carousel.png", "screenshot-2-homepage-carousel.png"),
    ("list-play-buttons.png", "screenshot-3-list-play-buttons.png"),
    ("popup-search.png", "screenshot-4-popup-search.png"),
    ("lightbox-player.png", "screenshot-5-lightbox-player.png"),
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def flatten_rgb(img: Image.Image, bg: tuple[int, int, int] = BG) -> Image.Image:
    if img.mode == "RGBA":
        base = Image.new("RGB", img.size, bg)
        base.paste(img, mask=img.split()[3])
        return base
    return img.convert("RGB")


def crop_to_fill(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    img = flatten_rgb(img)
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        new_h = target_h
        new_w = round(src_w * (target_h / src_h))
    else:
        new_w = target_w
        new_h = round(src_h * (target_w / src_w))

    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = max(0, (new_w - target_w) // 2)
    top = max(0, (new_h - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def save_png24(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    flatten_rgb(img).save(path, format="PNG")


def make_screenshots() -> list[tuple[str, tuple[int, int]]]:
    created: list[tuple[str, tuple[int, int]]] = []
    for src_name, out_name in SCREENSHOT_JOBS:
        src = SCREENSHOTS / src_name
        out = OUT / out_name
        img = Image.open(src)
        result = crop_to_fill(img, 1280, 800)
        save_png24(result, out)
        created.append((out_name, result.size))
    return created


def make_small_promo() -> tuple[str, tuple[int, int]]:
    w, h = 440, 280
    canvas = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(canvas)

    icon = flatten_rgb(Image.open(ICONS / "icon128.png"))
    icon_size = 120
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon_x = 36
    icon_y = (h - icon_size) // 2
    canvas.paste(icon, (icon_x, icon_y))

    title_font = load_font(42, bold=True)
    tag_font = load_font(18)
    text_x = icon_x + icon_size + 28
    draw.text((text_x, 92), "IMDBPlay", fill=YELLOW, font=title_font)
    draw.text((text_x, 148), "Play from IMDb", fill=GRAY, font=tag_font)

    out_name = "promo-small-440x280.png"
    out = OUT / out_name
    save_png24(canvas, out)
    return out_name, canvas.size


def make_marquee_promo() -> tuple[str, tuple[int, int]]:
    w, h = 1400, 560
    canvas = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(canvas)

    # Right panel: homepage carousel crop
    carousel = crop_to_fill(Image.open(SCREENSHOTS / "homepage-carousel.png"), 760, h)
    canvas.paste(carousel, (w - 760, 0))

    # Soft fade between brand panel and screenshot
    fade_w = 120
    fade = Image.new("RGBA", (fade_w, h), (0, 0, 0, 0))
    fade_draw = ImageDraw.Draw(fade)
    for x in range(fade_w):
        alpha = int(255 * (x / fade_w))
        fade_draw.line([(x, 0), (x, h)], fill=(*BG, alpha))
    canvas.paste(fade, (w - 760 - fade_w, 0), fade)

    icon = flatten_rgb(Image.open(ICONS / "icon128.png"))
    icon_size = 160
    icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    canvas.paste(icon, (64, 120))

    title_font = load_font(72, bold=True)
    tag_font = load_font(30)
    sub_font = load_font(22)
    draw.text((260, 148), "IMDBPlay", fill=YELLOW, font=title_font)
    draw.text((260, 248), "Play movies & TV from IMDb", fill=WHITE, font=tag_font)
    draw.text((260, 310), "One-click Play Now · Toolbar search · Lightbox player", fill=GRAY, font=sub_font)

    out_name = "promo-marquee-1400x560.png"
    out = OUT / out_name
    save_png24(canvas, out)
    return out_name, canvas.size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    results: list[tuple[str, tuple[int, int]]] = []
    results.extend(make_screenshots())
    results.append(make_small_promo())
    results.append(make_marquee_promo())

    print("Created store assets:")
    for name, size in results:
        print(f"  {name}: {size[0]}x{size[1]}")


if __name__ == "__main__":
    main()
