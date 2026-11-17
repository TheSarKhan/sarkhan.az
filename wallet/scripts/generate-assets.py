#!/usr/bin/env python3
"""Generate Apple Wallet generic pass image assets (icon, logo, thumbnail) at 1x/2x/3x."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = ROOT / "wallet" / "assets"
PORTRAIT_PATH = ROOT / "frontend" / "public" / "assets" / "portrait-seated.webp"

DEEP_GREEN = (6, 78, 59, 255)        # #064E3B
DARK_FOREST = (7, 59, 49, 255)       # #073B31
GOLD = (212, 175, 103, 255)          # #D4AF67
IVORY = (248, 247, 243, 255)         # #F8F7F3


def load_font(size: int):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def make_icon(scale: int) -> None:
    size = 29 * scale
    # Render at 4x supersampling for crisp anti-aliased edges
    ss = size * 4
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(ss * 0.22)
    draw.rounded_rectangle([0, 0, ss - 1, ss - 1], radius=radius, fill=DEEP_GREEN)
    inset = max(4, int(ss * 0.08))
    draw.rounded_rectangle(
        [inset, inset, ss - 1 - inset, ss - 1 - inset],
        radius=max(2, radius - inset // 2),
        outline=GOLD,
        width=max(3, int(ss * 0.04)),
    )

    font = load_font(int(ss * 0.42))
    text = "SB"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (ss - tw) / 2 - bbox[0]
    ty = (ss - th) / 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=IVORY)

    out = img.resize((size, size), Image.Resampling.LANCZOS)
    suffix = "" if scale == 1 else f"@{scale}x"
    out.save(ASSETS_DIR / f"icon{suffix}.png", "PNG", optimize=True)


def make_logo(scale: int) -> None:
    # Apple Wallet logo max display size: 160x50 pt. Use clean 44x44 pt emblem + subtle gold frame.
    w = 44 * scale
    h = 44 * scale
    ss_w, ss_h = w * 4, h * 4
    img = Image.new("RGBA", (ss_w, ss_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(ss_w * 0.06)
    radius = int(ss_w * 0.22)
    draw.rounded_rectangle(
        [pad, pad, ss_w - 1 - pad, ss_h - 1 - pad],
        radius=radius,
        fill=DARK_FOREST,
        outline=GOLD,
        width=max(4, int(ss_w * 0.045)),
    )

    font = load_font(int(ss_w * 0.40))
    text = "SB"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (ss_w - tw) / 2 - bbox[0]
    ty = (ss_h - th) / 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=GOLD)

    out = img.resize((w, h), Image.Resampling.LANCZOS)
    suffix = "" if scale == 1 else f"@{scale}x"
    out.save(ASSETS_DIR / f"logo{suffix}.png", "PNG", optimize=True)


def make_thumbnail(scale: int) -> None:
    # Apple Wallet generic pass thumbnail: 90x90 pt (180x180 @2x, 270x270 @3x)
    size = 90 * scale
    if not PORTRAIT_PATH.exists():
        raise FileNotFoundError(f"Missing portrait image: {PORTRAIT_PATH}")

    with Image.open(PORTRAIT_PATH) as src:
        src = src.convert("RGBA")
        sw, sh = src.size
        # Crop square centered horizontally and biased toward upper-center for face framing
        side = min(sw, sh)
        left = (sw - side) // 2
        top = max(0, int((sh - side) * 0.14))
        if top + side > sh:
            top = sh - side
        cropped = src.crop((left, top, left + side, top + side))
        resized = cropped.resize((size, size), Image.Resampling.LANCZOS)

        # Subtle rounded corners + gold border matching pass aesthetic
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        radius = int(size * 0.14)
        mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(resized, (0, 0), mask)

        border = ImageDraw.Draw(out)
        border.rounded_rectangle(
            [0, 0, size - 1, size - 1],
            radius=radius,
            outline=GOLD,
            width=max(2, scale * 2),
        )

        suffix = "" if scale == 1 else f"@{scale}x"
        out.save(ASSETS_DIR / f"thumbnail{suffix}.png", "PNG", optimize=True)


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    for scale in (1, 2, 3):
        make_icon(scale)
        make_logo(scale)
        make_thumbnail(scale)
    print(f"Generated Apple Wallet assets in {ASSETS_DIR}")


if __name__ == "__main__":
    main()
