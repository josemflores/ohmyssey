#!/usr/bin/env python3
"""Paint the art for the contest of the bow and the fight in the hall (Level 2).

Odyssey 21-22: Penelope brings out the great bow of Odysseus and sets the
contest: string the bow and shoot an arrow through the rings of twelve axe
heads set in a line. Every suitor fails to bend it. The beggar asks to try,
strings it at once, and shoots through all twelve. Then he turns the bow on
the suitors.

Everything is built from the game's own pixel sprites and props, plus a bow,
an arrow and axes drawn here, pixel by pixel:

  public/assets/battle/odysseus_bow_idle_e.png   2 frames, 32 x 32, facing east
  public/assets/battle/odysseus_bow_shoot_e.png  6 frames: draw, draw, full
                                                 draw, release, follow, rest
  public/assets/battle/arrow.png                 16 x 5, flies across in CSS
  public/assets/battle/hall_battle.png           480 x 270 battle backdrop
  public/assets/contest/*.png                    240 x 135 cutscene pictures

Run from the repo root (needs Pillow):

  python3 art/scripts/build_hall_contest.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "public" / "assets"
BATTLE = PUB / "battle"
CONTEST = PUB / "contest"

# Sheet rows for the 8-way LPC sheets: S, SW, W, NW, N, NE, E, SE.
S, SW, W, NW, N, NE, E, SE = range(8)

WOOD = (92, 52, 24, 255)
WOOD_DARK = (40, 22, 12, 255)
WOOD_LIGHT = (150, 98, 50, 255)
HORN = (232, 216, 176, 255)
STRING = (236, 228, 206, 255)
SKIN = (249, 213, 186, 255)
SHAFT = (156, 112, 62, 255)
IRON = (196, 200, 210, 255)
IRON_DARK = (70, 74, 86, 255)
FLETCH = (206, 46, 34, 255)
CLEAR = (0, 0, 0, 0)


def load(path: str) -> Image.Image:
    return Image.open(PUB / path).convert("RGBA")


def cell(sheet: Image.Image, col: int, row: int, w: int = 32, h: int = 32) -> Image.Image:
    return sheet.crop((col * w, row * h, col * w + w, row * h + h))


def put(canvas: Image.Image, img: Image.Image, cx: int, bottom: int, scale: int = 1) -> None:
    """Paste with alpha, centred on cx, standing on `bottom`."""
    if scale != 1:
        img = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    canvas.alpha_composite(img, (int(cx - img.width // 2), int(bottom - img.height)))


def line(img: Image.Image, a: tuple[int, int], b: tuple[int, int], color) -> None:
    (x0, y0), (x1, y1) = a, b
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        if 0 <= x0 < img.width and 0 <= y0 < img.height:
            img.putpixel((x0, y0), color)
        if x0 == x1 and y0 == y1:
            return
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def bow(img: Image.Image, tip_x: int, top: int, bottom: int, bulge: int, pull=None, facing: int = 1) -> None:
    """A recurved bow standing upright. The limbs bulge toward `facing`
    (1 = east). `pull` is where the string is drawn back to (None: at rest)."""
    mid = (top + bottom) / 2
    half = (bottom - top) / 2
    for y in range(top, bottom + 1):
        t = (y - mid) / half
        x = tip_x + facing * round(bulge * (1 - t * t))
        img.putpixel((x, y), WOOD)
        img.putpixel((x + facing, y), WOOD_DARK)
        if abs(t) < 0.5:
            img.putpixel((x - facing, y), WOOD_LIGHT)
    for y in (top, bottom):
        img.putpixel((tip_x, y), HORN)
    if pull is None:
        line(img, (tip_x, top + 1), (tip_x, bottom - 1), STRING)
    else:
        line(img, (tip_x, top + 1), pull, STRING)
        line(img, pull, (tip_x, bottom - 1), STRING)


def arrow_in(img: Image.Image, x0: int, x1: int, y: int) -> None:
    """An arrow lying east from x0 (nock) to x1 (point)."""
    for x in range(x0, x1 - 1):
        img.putpixel((x, y), SHAFT)
    img.putpixel((x1 - 1, y), IRON)
    img.putpixel((x1, y), IRON)
    img.putpixel((x1 - 1, y - 1), IRON_DARK)
    img.putpixel((x1 - 1, y + 1), IRON_DARK)
    img.putpixel((x0 + 1, y - 1), FLETCH)
    img.putpixel((x0 + 1, y + 1), FLETCH)
    img.putpixel((x0 + 2, y - 1), FLETCH)
    img.putpixel((x0 + 2, y + 1), FLETCH)


# ---- Odysseus with the bow --------------------------------------------------

GRIP_Y = 19


def bowman_base() -> Image.Image:
    """Odysseus facing east, sword taken out of his hand."""
    sheet = load("battle/odysseus_idle_e.png")
    body = cell(sheet, 0, 0)
    px = body.load()
    for y in range(20, 32):
        for x in range(20, 32):
            px[x, y] = CLEAR
    # The bow arm, reaching forward to the grip.
    for x in (19, 20, 21, 22):
        px[x, GRIP_Y] = (41, 37, 58, 255)
        px[x, GRIP_Y + 1] = (27, 25, 43, 255)
    px[23, GRIP_Y] = SKIN
    px[23, GRIP_Y + 1] = SKIN
    return body


def bowman(state: str, breathe: int = 0) -> Image.Image:
    img = bowman_base()
    if breathe:
        # One pixel of breath: shift the upper body down.
        top = img.crop((0, 0, 32, 18))
        img.paste(CLEAR, (0, 0, 32, 18))
        img.alpha_composite(top, (0, 1))
    tip = 23
    if state == "rest":
        bow(img, tip, 9, 29, 3)
    elif state in ("draw1", "draw2", "full"):
        pull_x = {"draw1": 19, "draw2": 16, "full": 14}[state]
        bend = {"draw1": 3, "draw2": 4, "full": 4}[state]
        shrink = {"draw1": 0, "draw2": 1, "full": 1}[state]
        bow(img, tip - shrink, 9 + shrink, 29 - shrink, bend, pull=(pull_x, GRIP_Y))
        arrow_in(img, pull_x, min(31, tip + 7), GRIP_Y)
        img.putpixel((pull_x, GRIP_Y - 1), SKIN)
        img.putpixel((pull_x + 1, GRIP_Y - 1), SKIN)
    elif state == "release":
        # The string snaps forward past the limbs.
        bow(img, tip, 9, 29, 3, pull=(tip + 2, GRIP_Y))
    return img


def build_bowman() -> None:
    idle = Image.new("RGBA", (64, 32), CLEAR)
    idle.alpha_composite(bowman("rest"), (0, 0))
    idle.alpha_composite(bowman("rest", breathe=1), (32, 0))
    idle.save(BATTLE / "odysseus_bow_idle_e.png")

    states = ["draw1", "draw2", "full", "release", "rest", "rest"]
    shoot = Image.new("RGBA", (32 * len(states), 32), CLEAR)
    for i, state in enumerate(states):
        shoot.alpha_composite(bowman(state), (32 * i, 0))
    shoot.save(BATTLE / "odysseus_bow_shoot_e.png")

    arrow = Image.new("RGBA", (16, 5), CLEAR)
    arrow_in(arrow, 0, 15, 2)
    arrow.save(BATTLE / "arrow.png")


# ---- The hall, painted ----------------------------------------------------

def flagstones(img: Image.Image, top: int, size: int) -> None:
    d = ImageDraw.Draw(img)
    d.rectangle((0, top, img.width, img.height), fill=(138, 116, 88, 255))
    for r, y in enumerate(range(top, img.height, size)):
        off = (size // 2) * (r % 2)
        for x in range(-off, img.width, size):
            a = (216, 198, 164, 255) if (x // size + r) % 2 else (210, 191, 156, 255)
            d.rectangle((x + 1, y + 1, x + size - 2, y + size - 2), fill=a)
            d.line((x + 1, y + 1, x + size - 2, y + 1), fill=(234, 220, 192, 255))


def back_wall(img: Image.Image, bottom: int, scale: int) -> None:
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, img.width, bottom), fill=(58, 42, 30, 255))
    for x in range(0, img.width, 24 * scale):
        d.rectangle((x, 0, x + 3 * scale - 1, bottom), fill=(42, 30, 20, 255))
    band_top = bottom - 14 * scale
    d.rectangle((0, band_top, img.width, bottom), fill=(156, 59, 46, 255))
    d.rectangle((0, band_top + 3 * scale, img.width, band_top + 6 * scale), fill=(217, 163, 90, 255))
    # A meander line along the ochre band.
    y = band_top + 4 * scale
    for x in range(0, img.width, 8 * scale):
        d.rectangle((x, y, x + 4 * scale, y + scale - 1), fill=(58, 26, 16, 255))
        d.rectangle((x + 3 * scale, y, x + 4 * scale - 1, y + 2 * scale - 1), fill=(58, 26, 16, 255))
    d.rectangle((0, bottom - 3 * scale, img.width, bottom), fill=(90, 32, 24, 255))


def grade(img: Image.Image, tint=(196, 156, 112), dim: float = 1.0) -> Image.Image:
    """Firelight: multiply by a warm colour, darker toward the edges."""
    w, h = img.size
    out = img.copy()
    px = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dx = (x - w / 2) / (w / 2)
            dy = (y - h * 0.6) / h
            v = max(0.45, 1 - 0.35 * dx * dx - 0.6 * dy * dy) * dim
            px[x, y] = (int(r * tint[0] / 255 * v), int(g * tint[1] / 255 * v), int(b * tint[2] / 255 * v), a)
    return out


def hall_scene(w: int, h: int, wall: int, scale: int) -> Image.Image:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    flagstones(img, wall, 16 * scale)
    back_wall(img, wall, scale)
    return img


AXE_RING_DY = 11  # the ring hole sits this far above the floor line


def axe(img: Image.Image, x: int, floor: int) -> None:
    """An axe head set upright on its haft in a trench; the ring hole at
    the top is what the arrow must pass through."""
    for y in range(floor - 9, floor + 1):
        img.putpixel((x, y), WOOD)
        img.putpixel((x + 1, y), WOOD_DARK)
    ry = floor - AXE_RING_DY
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1)):
        img.putpixel((x + dx, ry + dy), IRON)
    img.putpixel((x, ry), (24, 18, 14, 255))
    # The blade, to the right of the ring.
    for y in range(ry - 2, ry + 4):
        for xx in range(x + 2, x + 5):
            img.putpixel((xx, y), IRON if xx < x + 4 else IRON_DARK)
    d = ImageDraw.Draw(img)
    d.line((x - 2, floor + 1, x + 3, floor + 1), fill=(96, 74, 52, 255))


def axes_row(img: Image.Image, x0: int, step: int, floor: int, count: int = 12) -> list[int]:
    xs = [x0 + i * step for i in range(count)]
    for x in xs:
        axe(img, x, floor)
    return xs


def carried_bow(img: Image.Image, x: int, top: int, bottom: int, strung: bool = True, facing: int = 1) -> None:
    if strung:
        bow(img, x, top, bottom, 3, facing=facing)
    else:
        # Unstrung: nearly straight, the string hanging loose.
        for y in range(top, bottom + 1):
            img.putpixel((x, y), WOOD)
            img.putpixel((x + facing, y), WOOD_DARK)
        line(img, (x - facing, top + 2), (x - 3 * facing, bottom - 4), STRING)


def sweat(img: Image.Image, x: int, y: int) -> None:
    for dx, dy in ((0, 0), (0, 1), (3, -2), (3, -1)):
        img.putpixel((x + dx, y + dy), (150, 210, 240, 255))


def build_backdrop() -> None:
    img = hall_scene(480, 270, 92, 2)
    put(img, load("props/palace_throne.png"), 240, 150, 2)
    for x in (110, 370):
        put(img, load("props/palace_column.png"), x, 196, 2)
    for x in (40, 440):
        put(img, cell(load("props/palace_brazier.png"), 0, 0), x, 132, 2)
    put(img, load("props/palace_banquet.png"), 30, 236, 2)
    put(img, load("props/palace_banquet.png"), 452, 236, 2)
    put(img, cell(load("props/palace_loom.png"), 0, 0, 32, 48), 186, 160, 2)
    put(img, load("props/palace_bow_rack.png"), 300, 160, 2)
    grade(img, dim=0.85).convert("RGB").save(BATTLE / "hall_battle.png")


def suitor(name: str) -> Image.Image:
    return load(f"sprites/npcs/{name}")


def build_contest() -> None:
    CONTEST.mkdir(parents=True, exist_ok=True)
    antinous = suitor("suitor_lpc/suitor_a_1.png")
    eurymachus = suitor("suitor_lpc/suitor_b_2.png")
    amphinomus = suitor("suitor_lpc/suitor_c_4.png")
    extras = [suitor(f"suitor_lpc/suitor_{k}.png") for k in ("b_3", "c_1", "a_2", "c_3", "a_4", "b_1")]
    penelope = load("sprites/npcs/penelope/penelope_sheet.png")
    beggar = load("sprites/odysseus_beggar/idle.png")
    telemachus = suitor("telemachus/telemachus_32.png")
    hearth = cell(load("props/palace_hearth.png"), 0, 0, 48, 32)
    throne = load("props/palace_throne.png")
    banquet = load("props/palace_banquet.png")
    W2, H2, WALL = 240, 135, 46

    def scene():
        return hall_scene(W2, H2, WALL, 1)

    # 1. Penelope brings out the great bow.
    img = scene()
    put(img, throne, 120, 82)
    put(img, cell(penelope, 0, S), 120, 104)
    carried_bow(img, 131, 76, 98)
    for x, sheet, row in ((50, antinous, E), (74, extras[0], E), (168, eurymachus, W), (194, extras[1], W)):
        put(img, cell(sheet, 0, row), x, 120)
    put(img, banquet, 28, 74)
    put(img, banquet, 212, 74)
    grade(img).save(CONTEST / "bow_brought.png")

    # 2. Telemachus sets twelve axes in a line.
    img = scene()
    for x, sheet in ((60, extras[2]), (92, amphinomus), (150, extras[3]), (182, extras[4])):
        put(img, cell(sheet, 0, S), x, 82)
    axes_row(img, 48, 13, 108)
    put(img, cell(telemachus, 0, W), 214, 118)
    grade(img).save(CONTEST / "axes.png")

    # 3. The suitors try, and none can bend it.
    img = scene()
    put(img, cell(extras[5], 0, E), 98, 104)
    carried_bow(img, 109, 78, 100, strung=False)
    sweat(img, 92, 76)
    sweat(img, 104, 74)
    for x, sheet, row in ((44, extras[0], E), (64, extras[1], E), (150, antinous, W)):
        put(img, cell(sheet, 0, row), x, 112)
    axes_row(img, 168, 6, 112, count=8)
    grade(img).save(CONTEST / "suitors_fail.png")

    # 4. Antinous warms the bow at the fire. Still it will not bend.
    img = scene()
    put(img, hearth, 120, 102)
    for x in range(100, 141):
        img.putpixel((x, 82 + ((x - 120) ** 2) // 120), WOOD)
        img.putpixel((x, 83 + ((x - 120) ** 2) // 120), WOOD_DARK)
    put(img, cell(antinous, 0, E), 86, 104)
    put(img, cell(eurymachus, 0, W), 156, 104)
    sweat(img, 152, 76)
    grade(img, tint=(214, 150, 100)).save(CONTEST / "hearth.png")

    # 5. The beggar asks to try. He strings it as a singer strings a lyre.
    img = scene()
    put(img, cell(beggar, 2, 0), 70, 108)
    carried_bow(img, 80, 82, 104)
    for x, sheet in ((150, antinous), (176, eurymachus), (202, extras[2])):
        put(img, cell(sheet, 0, W), x, 104)
    put(img, cell(penelope, 0, S), 120, 74)
    grade(img).save(CONTEST / "beggar.png")

    # 6. The shot: the beggar at the left, the axes in a line. The arrow
    #    itself flies in CSS, through the rings (AXE_RING_DY above the floor).
    img = scene()
    put(img, cell(beggar, 2, 0), 26, 104)
    bow(img, 36, 80, 100, 4, pull=(30, 90))
    floor = 90 + AXE_RING_DY
    axes_row(img, 64, 13, floor)
    for x, sheet in ((90, extras[0]), (130, antinous), (170, extras[3])):
        put(img, cell(sheet, 0, S), x, 70)
    grade(img).save(CONTEST / "shot.png")

    # 7. He throws off his rags. The suitors look for their spears.
    img = scene()
    king = Image.open(BATTLE / "odysseus_bow_idle_e.png").convert("RGBA").crop((0, 0, 32, 32))
    put(img, king, 52, 108, 1)
    for x, y, sheet in ((140, 98, antinous), (166, 110, eurymachus), (190, 96, amphinomus), (210, 114, extras[1])):
        put(img, cell(sheet, 0, W), x, y)
    put(img, banquet, 212, 74)
    grade(img, tint=(220, 140, 110)).save(CONTEST / "turn.png")

    print("ring line in shot.png: y =", 90, "of", H2, f"({90 / H2 * 100:.1f}%)")


if __name__ == "__main__":
    build_bowman()
    build_backdrop()
    build_contest()
    print("Wrote bow sprites, hall backdrop, and contest pictures.")
