#!/usr/bin/env python3
"""Generate Apple Wallet assets matching the user's uploaded sarkhan.az card design and logo."""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "frontend" / "public" / "assets" / "wallet"
PORTRAIT_PATH = ROOT / "frontend" / "public" / "assets" / "portrait-seated.webp"
USER_LOGO_PATH = Path(
    "/Users/sarkhanvibes/.gemini/antigravity/brain/89cd9c96-c139-43b1-a130-3714d7f780ee/.user_uploaded/media_1794924291771_09e6d8e7.png"
)

IVORY_BG = (246, 247, 242, 255)      # #F6F7F2
DARK_GREEN = (27, 67, 50, 255)       # #1B4332
MID_GREEN = (64, 121, 92, 255)       # #40795C
SAGE_LIGHT = (216, 232, 219, 255)    # #D8E8DB
SAGE_MID = (168, 202, 175, 255)      # #A8CAAF
WAVE_DARK = (46, 102, 68, 255)       # #2E6644


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


def build_logo_and_icon() -> None:
    with Image.open(USER_LOGO_PATH) as raw:
        raw = raw.convert("RGBA")
        # Trim transparent/white outer margin
        bbox = raw.getbbox()
        if bbox:
            raw = raw.crop(bbox)

        # logo.png (160x160 transparent PNG for WalletWallet)
        logo_canvas = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        scaled = raw.copy()
        scaled.thumbnail((140, 140), Image.Resampling.LANCZOS)
        lx = (160 - scaled.width) // 2
        ly = (160 - scaled.height) // 2
        logo_canvas.paste(scaled, (lx, ly), scaled)
        logo_canvas.save(OUT_DIR / "logo.png", "PNG", optimize=True)

        # icon.png (87x87 ivory rounded square with user logo centered)
        icon = Image.new("RGBA", (87, 87), (0, 0, 0, 0))
        draw = ImageDraw.Draw(icon)
        draw.rounded_rectangle([0, 0, 86, 86], radius=18, fill=IVORY_BG, outline=SAGE_MID, width=2)
        icon_mark = raw.copy()
        icon_mark.thumbnail((62, 62), Image.Resampling.LANCZOS)
        ix = (87 - icon_mark.width) // 2
        iy = (87 - icon_mark.height) // 2
        icon.paste(icon_mark, (ix, iy), icon_mark)
        icon.save(OUT_DIR / "icon.png", "PNG", optimize=True)


def draw_wave(draw: ImageDraw.ImageDraw, w: int, h: int, base_y: float, amp: float, phase: float, color):
    pts = [(0, h)]
    for x in range(0, w + 1, 4):
        y = base_y + amp * math.sin((x / w) * 2.1 * math.pi + phase)
        pts.append((x, y))
    pts.append((w, h))
    draw.polygon(pts, fill=color)


def build_strip() -> None:
    w, h = 750, 246
    img = Image.new("RGBA", (w, h), IVORY_BG)
    draw = ImageDraw.Draw(img)

    # Organic layered green waves matching the uploaded card design
    draw_wave(draw, w, h, base_y=176, amp=22, phase=0.2, color=SAGE_LIGHT)
    draw_wave(draw, w, h, base_y=204, amp=18, phase=2.4, color=SAGE_MID)
    draw_wave(draw, w, h, base_y=226, amp=14, phase=4.0, color=WAVE_DARK)

    # Subtle minimalist product/PM cards on left & right
    # Left checklist card
    draw.rounded_rectangle([54, 46, 152, 124], radius=14, fill=(255, 255, 255, 240), outline=SAGE_MID, width=2)
    draw.rounded_rectangle([54, 46, 152, 60], radius=6, fill=WAVE_DARK)
    draw.line([(72, 80), (134, 80)], fill=MID_GREEN, width=4)
    draw.line([(72, 100), (122, 100)], fill=SAGE_MID, width=4)

    # Right sprint loop card
    draw.rounded_rectangle([598, 46, 696, 124], radius=14, fill=(255, 255, 255, 240), outline=SAGE_MID, width=2)
    draw.arc([624, 62, 670, 108], start=30, end=310, fill=WAVE_DARK, width=5)
    draw.polygon([(666, 98), (680, 104), (664, 114)], fill=WAVE_DARK)

    # Dashed connector arcs toward center portrait
    for x in range(168, 286, 14):
        draw.line([(x, 86), (x + 7, 86)], fill=SAGE_MID, width=2)
    for x in range(468, 586, 14):
        draw.line([(x, 86), (x + 7, 86)], fill=SAGE_MID, width=2)

    # Center circular portrait with sage-green ring
    if PORTRAIT_PATH.exists():
        with Image.open(PORTRAIT_PATH) as src:
            src = src.convert("RGBA")
            sw, sh = src.size
            side = min(sw, sh)
            left = (sw - side) // 2
            top = max(0, int((sh - side) * 0.14))
            cropped = src.crop((left, top, left + side, top + side))

            psize = 152
            portrait = cropped.resize((psize, psize), Image.Resampling.LANCZOS)
            mask = Image.new("L", (psize, psize), 0)
            ImageDraw.Draw(mask).ellipse([0, 0, psize - 1, psize - 1], fill=255)

            px = (w - psize) // 2
            py = 22
            # Outer soft ring
            draw.ellipse([px - 6, py - 6, px + psize + 5, py + psize + 5], fill=(255, 255, 255, 255), outline=SAGE_MID, width=3)
            img.paste(portrait, (px, py), mask)

    # Pill label under portrait
    pill_font = load_font(17, bold=True)
    pill_text = "Product Owner  ·  sarkhan.az"
    bbox = draw.textbbox((0, 0), pill_text, font=pill_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pw, ph = tw + 36, th + 16
    px0, py0 = (w - pw) // 2, 186
    draw.rounded_rectangle([px0, py0, px0 + pw, py0 + ph], radius=999, fill=SAGE_LIGHT, outline=SAGE_MID, width=1)
    draw.text((px0 + 18 - bbox[0], py0 + 8 - bbox[1]), pill_text, font=pill_font, fill=DARK_GREEN)

    img.save(OUT_DIR / "strip.png", "PNG", optimize=True)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_logo_and_icon()
    build_strip()
    print(f"Generated brand-matched Wallet assets in {OUT_DIR}")


if __name__ == "__main__":
    main()
