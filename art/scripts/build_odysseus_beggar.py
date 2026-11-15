#!/usr/bin/env python3
"""Turn Odysseus's LPC sheets into the beggar from Odyssey book 13.

Same frame sizes, rows, and counts as the king sheets, so the walk and idle
code can swap textures. Armor becomes a patched brown-gray cloak, the crest
becomes a short hood, the sword becomes a wooden staff, and the feet are wrapped.

Run from the repo root:

  python3 art/scripts/build_odysseus_beggar.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "assets" / "sprites"
OUT = SRC / "odysseus_beggar"

# file, frame size, frames across
SHEETS = [
    ("odysseus_idle.png", "idle.png", 32),
    ("odysseus_walk.png", "walk.png", 32),
    ("odysseus_idle_animation.png", "idle_animation.png", 32),
    ("odysseus_attack.png", "attack.png", 64),
    ("odysseus_hit.png", "hit.png", 32),
]

WOOD = ((92, 58, 28), (120, 78, 40), (64, 40, 18))
HOOD = ((72, 48, 32), (98, 68, 44), (54, 36, 24))
CLOAK = ((58, 40, 28), (86, 60, 40), (44, 32, 24))
PATCH = ((128, 120, 108), (96, 88, 78), (110, 78, 52))
BEARD = (108, 102, 94)
SKIN = (206, 168, 132)
WRAP = (138, 112, 82)


def kind(r: int, g: int, b: int) -> str:
    if r > 130 and r > g * 1.7 and r > b * 1.4 and g < 90:
        return "plume"
    if r > 185 and g > 145 and b > 115:
        return "skin"
    if r > 120 and g < 100 and b < 90 and r > g + 30:
        return "ruddy"
    if max(r, g, b) < 28:
        return "outline"
    if abs(r - g) < 24 and abs(g - b) < 24 and r >= 150:
        return "metal"
    if abs(r - g) < 32 and abs(g - b) < 32:
        return "gray"
    if r > 70 and g > 35 and b < 80 and r > b + 15:
        return "leather"
    if b > 160 and g > 140 and r < 120:
        return "eye"
    return "armor"


def cloak_tone(x: int, y: int, lum: float) -> tuple[int, int, int]:
    # A few lighter pixels read as patches and worn cloth, not a flat dye.
    if (x * 3 + y * 5) % 9 == 0:
        return PATCH[(x + y) % 3]
    base = CLOAK[0 if lum < 45 else 1 if lum < 90 else 2]
    return base


def paint(r: int, g: int, b: int, x: int, y: int) -> tuple[int, int, int, int]:
    fam = kind(r, g, b)
    if fam == "outline":
        return (16, 10, 8, 255)
    if fam == "plume":
        return (*HOOD[(x + y) % 3], 255)
    if fam == "skin":
        return (*SKIN, 255)
    if fam == "ruddy":
        return (*BEARD, 255)
    if fam == "metal":
        return (*WOOD[(x + y) % 3], 255)
    if fam == "leather":
        return (*WRAP, 255)
    if fam == "eye":
        return (64, 72, 78, 255)
    if fam == "gray":
        return (*cloak_tone(x, y, (r + g + b) / 3), 255)
    return (*cloak_tone(x, y, (r + g + b) / 3), 255)


def shorten_crest(frame: Image.Image) -> None:
    """Drop the tall red spike so the hood does not keep a helmet crest."""
    pix = frame.load()
    w, h = frame.size
    for x in range(w):
        plume = []
        for y in range(h):
            r, g, b, a = pix[x, y]
            if a and kind(r, g, b) == "plume":
                plume.append(y)
        if len(plume) > 2:
            for y in plume[:-2]:
                pix[x, y] = (0, 0, 0, 0)


def add_staff(frame: Image.Image) -> None:
    """Front and back views hide the sword. Plant a short staff beside him."""
    pix = frame.load()
    w, h = frame.size
    xs = [x for y in range(h) for x in range(w) if pix[x, y][3]]
    if not xs:
        return
    left, right = min(xs), max(xs)
    if right - left > 18:
        return
    ys = [y for y in range(h) for x in range(w) if pix[x, y][3]]
    top, bot = min(ys), max(ys)
    sx = min(w - 1, right + 1)
    y0 = top + max(6, (bot - top) // 2)
    for i, y in enumerate(range(y0, bot + 1)):
        if pix[sx, y][3] == 0:
            pix[sx, y] = (*WOOD[i % 3], 255)


def convert(src: Path, frame: int) -> Image.Image:
    sheet = Image.open(src).convert("RGBA")
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    cols = sheet.size[0] // frame
    rows = sheet.size[1] // frame
    for row in range(rows):
        for col in range(cols):
            box = (col * frame, row * frame, (col + 1) * frame, (row + 1) * frame)
            cell = sheet.crop(box)
            shorten_crest(cell)
            painted = Image.new("RGBA", cell.size, (0, 0, 0, 0))
            src_px = cell.load()
            dst_px = painted.load()
            for y in range(frame):
                for x in range(frame):
                    r, g, b, a = src_px[x, y]
                    if not a:
                        continue
                    dst_px[x, y] = paint(r, g, b, x, y)
            add_staff(painted)
            out.paste(painted, box[:2])
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name, frame in SHEETS:
        image = convert(SRC / src_name, frame)
        dest = OUT / dest_name
        image.save(dest)
        print(f"{dest.relative_to(ROOT)} {image.size}")


if __name__ == "__main__":
    main()
