#!/usr/bin/env python3
"""Generate a bank-card-style rectangular strip banner (750x246 @2x) for Apple Wallet."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "frontend" / "public" / "assets" / "wallet" / "strip.png"
PORTRAIT_PATH = ROOT / "frontend" / "public" / "assets" / "portrait-seated.webp"

DEEP_GREEN = (6, 78, 59)
DARK_FOREST = (7, 59, 49)
GOLD = (212, 175, 103, 255)
GOLD_SOFT = (212, 175, 103, 95)
IVORY = (248, 247, 243, 255)
IVORY_MUTED = (248, 247, 243, 185)


def load_font(size: int, bold: bool = True):
    candidates = (
        [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
        if bold
        else [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    )
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def main() -> None:
    w, h = 750, 246
    img = Image.new("RGBA", (w, h), (*DEEP_GREEN, 255))
    draw = ImageDraw.Draw(img)

    # Diagonal luxury bank-card gradient
    for x in range(w):
        t = x / (w - 1)
        r = int(DEEP_GREEN[0] * (1 - t) + DARK_FOREST[0] * t)
        g = int(DEEP_GREEN[1] * (1 - t) + DARK_FOREST[1] * t)
        b = int(DEEP_GREEN[2] * (1 - t) + DARK_FOREST[2] * t)
        draw.line([(x, 0), (x, h)], fill=(r, g, b, 255))

    # Subtle architectural gold accent lines
    draw.line([(0, 12), (w, 12)], fill=GOLD_SOFT, width=2)
    draw.line([(0, h - 13), (w, h - 13)], fill=GOLD_SOFT, width=2)
    draw.arc([w - 320, -140, w + 120, 300], start=110, end=250, fill=GOLD_SOFT, width=2)

    # Metallic gold EMV-style identity chip on left
    cx, cy, cw, ch = 44, 52, 68, 50
    draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=10, fill=(212, 175, 103, 235), outline=IVORY, width=1)
    draw.line([(cx + 22, cy), (cx + 22, cy + ch)], fill=(7, 59, 49, 180), width=2)
    draw.line([(cx + 46, cy), (cx + 46, cy + ch)], fill=(7, 59, 49, 180), width=2)
    draw.line([(cx, cy + 25), (cx + 22, cy + 25)], fill=(7, 59, 49, 180), width=2)
    draw.line([(cx + 46, cy + 25), (cx + cw, cy + 25)], fill=(7, 59, 49, 180), width=2)

    # Contactless wave mark next to chip
    wx, wy = cx + cw + 18, cy + 25
    for rad in (10, 18, 26):
        draw.arc([wx - rad, wy - rad, wx + rad, wy + rad], start=-50, end=50, fill=GOLD, width=3)

    # Card typography
    title_font = load_font(30, bold=True)
    sub_font = load_font(19, bold=False)
    tag_font = load_font(15, bold=True)

    draw.text((44, 126), "SƏRXAN BABAYEV", font=title_font, fill=IVORY)
    draw.text((44, 166), "Product Owner · IT PM · Business Analyst", font=sub_font, fill=IVORY_MUTED)
    draw.text((44, 200), "SARKHAN.AZ  •  DIGITAL IDENTITY", font=tag_font, fill=GOLD)

    # Right-side framed portrait badge
    if PORTRAIT_PATH.exists():
        with Image.open(PORTRAIT_PATH) as src:
            src = src.convert("RGBA")
            sw, sh = src.size
            side = min(sw, sh)
            left = (sw - side) // 2
            top = max(0, int((sh - side) * 0.14))
            cropped = src.crop((left, top, left + side, top + side))
            psize = 148
            portrait = cropped.resize((psize, psize), Image.Resampling.LANCZOS)

            mask = Image.new("L", (psize, psize), 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, psize - 1, psize - 1], radius=24, fill=255)

            px, py = w - psize - 40, (h - psize) // 2
            img.paste(portrait, (px, py), mask)
            draw.rounded_rectangle([px, py, px + psize - 1, py + psize - 1], radius=24, outline=GOLD, width=3)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT_PATH, "PNG", optimize=True)
    print(f"Saved strip banner to {OUT_PATH}")


if __name__ == "__main__":
    main()
