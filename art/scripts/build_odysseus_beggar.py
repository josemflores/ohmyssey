#!/usr/bin/env python3
"""Turn Odysseus's LPC sheets into the beggar from Odyssey book 13.

Same frame sizes, rows, and counts as the king sheets. The crest and helmet
come off, the sword and spear are erased (including the attack swing), and
what remains is a bareheaded old man: gray hair, gray beard, a patched brown
cloak, wrapped feet, and a wooden staff.

Run from the repo root:

  python3 art/scripts/build_odysseus_beggar.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "assets" / "sprites"
OUT = SRC / "odysseus_beggar"

SHEETS = [
    ("odysseus_idle.png", "idle.png", 32),
    ("odysseus_walk.png", "walk.png", 32),
    ("odysseus_idle_animation.png", "idle_animation.png", 32),
    ("odysseus_attack.png", "attack.png", 64),
    ("odysseus_hit.png", "hit.png", 32),
]

WOOD = ((110, 72, 36), (78, 50, 24), (140, 96, 52))
HAIR = ((108, 102, 96), (78, 74, 68), (58, 54, 50))
BEARD = (124, 118, 110)
SKIN = (198, 158, 124)
CLOAK = ((62, 42, 30), (96, 68, 46), (48, 34, 26))
PATCH = ((150, 132, 110), (112, 100, 88), (128, 86, 58))
WRAP = (146, 116, 82)


def kind(r: int, g: int, b: int) -> str:
    if r > 130 and r > g * 1.7 and r > b * 1.4 and g < 90:
        return "plume"
    if r > 185 and g > 145 and b > 115:
        return "skin"
    if r > 120 and g < 100 and b < 90 and r > g + 30:
        return "ruddy"
    if max(r, g, b) < 28:
        return "outline"
    if abs(r - g) < 36 and abs(g - b) < 36 and max(r, g, b) >= 145:
        return "blade"
    if abs(r - g) < 32 and abs(g - b) < 32:
        return "gray"
    if r > 70 and g > 35 and b < 90 and r > b + 15:
        return "leather"
    if b > 160 and g > 140 and r < 120:
        return "eye"
    return "armor"


def is_blade(r: int, g: int, b: int) -> bool:
    # The sword is the light neutral crescent. Skin is warmer, so it stays.
    if max(r, g, b) < 150:
        return False
    if r > g + 28 and r > b + 18:
        return False
    return abs(r - g) < 42 and abs(g - b) < 42


def cloak_tone(x: int, y: int, lum: float) -> tuple[int, int, int]:
    if (x * 3 + y * 5) % 9 == 0:
        return PATCH[(x + y) % 3]
    if lum < 50:
        return CLOAK[0]
    if lum < 100:
        return CLOAK[1]
    return CLOAK[2]


def convert_frame(cell: Image.Image) -> Image.Image:
    src = cell.load()
    w, h = cell.size
    skin = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a and kind(r, g, b) in ("skin", "ruddy"):
                skin.append((x, y))

    face = None
    if len(skin) >= 3:
        xs = [p[0] for p in skin]
        ys = [p[1] for p in skin]
        face = (min(xs), min(ys), max(xs), max(ys))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pix = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if not a:
                continue
            fam = kind(r, g, b)
            if fam == "plume" or is_blade(r, g, b):
                continue
            if face and is_helmet(x, y, face, fam):
                continue
            if fam == "outline":
                pix[x, y] = (16, 10, 8, 255)
            elif fam in ("skin", "ruddy"):
                pix[x, y] = color_face(x, y, face)
            elif fam == "leather":
                pix[x, y] = (*WRAP, 255)
            elif fam == "eye":
                pix[x, y] = (70, 76, 80, 255)
            else:
                pix[x, y] = (*cloak_tone(x, y, (r + g + b) / 3), 255)

    if face:
        grow_hair(pix, w, h, face)
    else:
        crop_back_of_head(pix, w, h)
    drop_stray_weapon(pix, w, h)
    add_staff(pix, w, h)
    return out


def is_helmet(x: int, y: int, face: tuple[int, int, int, int], fam: str) -> bool:
    """The crest's helmet bowl sits above and beside the face. Drop it."""
    left, top, right, bot = face
    if fam in ("skin", "ruddy", "leather", "eye"):
        return False
    if y < top and left - 6 <= x <= right + 6:
        return True
    # Cheek plates and the brim, not a distant arm.
    if top <= y <= top + 2 and left - 5 <= x <= right + 5:
        if x < left - 1 or x > right + 1:
            return fam in ("armor", "gray", "outline")
    return False


def color_face(x: int, y: int, face: tuple[int, int, int, int] | None) -> tuple[int, int, int, int]:
    if not face:
        return (*SKIN, 255)
    _left, top, _right, bot = face
    mid = (top + bot) // 2
    if y >= mid:
        return (*BEARD, 255)
    return (*SKIN, 255)


def grow_hair(pix, w: int, h: int, face: tuple[int, int, int, int]) -> None:
    left, top, right, bot = face
    cx = (left + right) // 2
    # Three uneven tufts, not a flat brim.
    for x, tuft in ((cx - 1, 2), (cx, 3), (cx + 1, 2), (cx + 2, 1)):
        for dy in range(tuft):
            yy = top - 1 - dy
            if 0 <= x < w and 0 <= yy < h and pix[x, yy][3] == 0:
                pix[x, yy] = (*HAIR[(x + dy) % 3], 255)
    for dx in (-1, 0, 1):
        yy = bot + 1
        xx = cx + dx
        if 0 <= xx < w and 0 <= yy < h and pix[xx, yy][3] == 0:
            pix[xx, yy] = (*BEARD, 255)


def crop_back_of_head(pix, w: int, h: int) -> None:
    """North view has no face. Cut the helmet crown and leave gray hair."""
    cols: dict[int, list[int]] = {}
    for y in range(h):
        for x in range(w):
            if pix[x, y][3]:
                cols.setdefault(x, []).append(y)
    if not cols:
        return
    xs = sorted(cols)
    mid = xs[len(xs) // 2]
    for x in xs:
        if abs(x - mid) > 6:
            continue
        ys = cols[x]
        top = min(ys)
        if top > h * 0.55:
            continue
        for y in ys:
            if y < top + 5:
                pix[x, y] = (0, 0, 0, 0)
        if (x + top) % 2:
            continue
        for dy in range(2):
            yy = top + 5 - dy
            if 0 <= yy < h:
                pix[x, yy] = (*HAIR[(x + dy) % 3], 255)


def drop_stray_weapon(pix, w: int, h: int) -> None:
    """Anything sticking far past the cloak is the sword. The staff is added after."""
    xs = [x for y in range(h) for x in range(w) if pix[x, y][3]]
    ys = [y for y in range(h) for x in range(w) if pix[x, y][3]]
    if len(xs) < 8:
        return
    # Core is the lower body, where the cloak is, not the swung blade.
    lower = [x for y in range(h) for x in range(w) if pix[x, y][3] and y > h * 0.45]
    if len(lower) < 6:
        lower = xs
    lower.sort()
    center = lower[len(lower) // 2]
    reach = 6 if w <= 40 else 8
    for y in range(h):
        for x in range(w):
            if pix[x, y][3] and abs(x - center) > reach:
                pix[x, y] = (0, 0, 0, 0)


def add_staff(pix, w: int, h: int) -> None:
    xs = [x for y in range(h) for x in range(w) if pix[x, y][3]]
    ys = [y for y in range(h) for x in range(w) if pix[x, y][3]]
    if not xs:
        return
    right = max(xs)
    top, bot = min(ys), max(ys)
    sx = min(w - 1, right + 1)
    y0 = top + max(8, (bot - top) // 2)
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
            painted = convert_frame(sheet.crop(box))
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
