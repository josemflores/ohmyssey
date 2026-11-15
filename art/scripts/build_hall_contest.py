#!/usr/bin/env python3
"""Paint the art for the contest of the bow and the fight in the hall (Level 2).

Odyssey 21-22: Penelope brings out the great bow of Odysseus and sets the
contest: string the bow and shoot an arrow through the rings of twelve axe
heads set in a line. Every suitor fails to bend it. The beggar asks to try,
strings it at once, and shoots through all twelve. Then he turns the bow on
the suitors.

Everything is built from the game's own pixel sprites and props (the LPC
Penelope, suitors, Telemachus and the beggar with his bow), plus an arrow
and axes drawn here, pixel by pixel:

  public/assets/battle/arrow.png                 16 x 5, flies across in CSS
  public/assets/battle/hall_battle.png           480 x 270 battle backdrop
  public/assets/contest/<name>.png               240 x 135 still picture
  public/assets/contest/<name>_anim.png          the same picture, animated

Odysseus's battle bow sheets (odysseus_bow_*_e.png) come from
build_odysseus_beggar_lpc.py. Run that one first, then this one.

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


# ---- The arrow --------------------------------------------------------------
# Odysseus with the bow (odysseus_bow_idle_e / odysseus_bow_shoot_e) is now
# built from LPC layers by build_odysseus_beggar_lpc.py. Only the arrow that
# flies across the screen is drawn here.


def build_arrow() -> None:
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


# ---- The cutscene pictures, animated --------------------------------------
#
# Every picture is a short loop of frames, played at 8 frames a second by
# src/components/ScenePic.jsx. Some start with an intro that plays once (a
# walk, a draw of the bow) and then settle into the loop. Each scene writes:
#
#   <name>.png        one still frame (the last one), for the dim backdrops
#   <name>_anim.png   all the frames side by side, intro first, then the loop
#
# ANIMS lists (intro frames, loop frames) for each picture. ScenePic.jsx keeps
# the same numbers, so change both together.

W2, H2, WALL = 240, 135, 46
LOOP = 8
ANIMS = {
    "bow_brought": (8, LOOP),
    "axes": (32, LOOP),
    "suitors_fail": (0, LOOP),
    "hearth": (0, LOOP),
    "beggar": (0, LOOP),
    "string": (16, LOOP),
    "shot": (8, LOOP),
    "turn": (0, LOOP),
    # The ending, from build_ending.py.
    "chamber": (0, LOOP),
    "embrace": (24, LOOP),
    "dawn": (0, LOOP),
}

# Firelight brightness per frame: the fire flickers, the hall breathes with it.
FLICKER = [1.0, 0.96, 1.03, 0.98, 1.01, 0.95, 1.02, 0.99]


def idle(sheet: Image.Image, row: int, t: int, offset: int = 0) -> Image.Image:
    """A 4 x 8 LPC sheet: columns are the breathing frames (0, 0, 1, 1).
    Two picture frames per column, so one breath takes one second."""
    return cell(sheet, (t // 2 + offset) % 4, row)


def save_scene(name: str, frames: list[Image.Image]) -> None:
    intro, loop = ANIMS[name]
    if len(frames) != intro + loop:
        raise SystemExit(f"{name}: {len(frames)} frames, ANIMS says {intro} + {loop}")
    strip = Image.new("RGBA", (W2 * len(frames), H2))
    for i, f in enumerate(frames):
        strip.paste(f, (i * W2, 0))
    frames[-1].save(CONTEST / f"{name}.png")
    strip.save(CONTEST / f"{name}_anim.png", optimize=True)
    print(f"wrote contest/{name}_anim.png ({intro} intro + {loop} loop frames)")


def bending_bow(img: Image.Image, x: int, top: int, bottom: int, bend: int) -> None:
    """The unstrung bow while a suitor leans on it: the limbs bend `bend`
    pixels, the string still hangs loose because he cannot loop it on."""
    mid = (top + bottom) / 2
    half = (bottom - top) / 2
    for y in range(top, bottom + 1):
        k = (y - mid) / half
        bx = x + round(bend * (1 - k * k))
        img.putpixel((bx, y), WOOD)
        img.putpixel((bx + 1, y), WOOD_DARK)
    line(img, (x - 1, top + 2), (x - 3, bottom - 4), STRING)


def build_contest() -> None:
    CONTEST.mkdir(parents=True, exist_ok=True)
    antinous = suitor("suitor_lpc/suitor_a_1.png")
    eurymachus = suitor("suitor_lpc/suitor_b_2.png")
    amphinomus = suitor("suitor_lpc/suitor_c_4.png")
    extras = [suitor(f"suitor_lpc/suitor_{k}.png") for k in ("b_3", "c_1", "a_2", "c_3", "a_4", "b_1")]
    penelope = load("sprites/npcs/penelope/penelope_sheet.png")
    # The LPC beggar: idle_animation has 2 breathing frames per facing, in
    # the order s se e ne n nw w sw, so east is columns 4-5.
    beggar = load("sprites/odysseus_beggar/idle_animation.png")
    # The beggar with the bow, the 13 LPC shoot frames facing east:
    # 0-3 raise the bow, 4 nock, 5-8 draw, 9 release, 10-12 lower it.
    with_arrow = load("sprites/odysseus_beggar/bow_shoot_e.png")
    no_arrow = load("sprites/odysseus_beggar/bow_draw_e.png")
    telemachus = suitor("telemachus/telemachus_32.png")
    telemachus_walk = suitor("telemachus/telemachus_walk_32.png")
    hearth = load("props/palace_hearth.png")
    throne = load("props/palace_throne.png")
    banquet = load("props/palace_banquet.png")

    brazier = load("props/palace_brazier.png")

    def scene(t: int = 0):
        # The hall, with a brazier burning against the wall at each side.
        img = hall_scene(W2, H2, WALL, 1)
        for i, x in enumerate((12, 228)):
            put(img, cell(brazier, (t + 2 * i) % 4, 0), x, 60)
        return img

    def beggar_east(t: int) -> Image.Image:
        return cell(beggar, 4 + (t // 4) % 2, 0)

    def bow_rest(t: int) -> Image.Image:
        # Holding the bow at his side, breathing: LPC shoot frames 12 and 11.
        return cell(no_arrow, 12 if (t // 4) % 2 == 0 else 11, 0)

    # 1. Penelope stands before her throne and holds out the great bow in
    #    both hands (LPC shoot frames: level at her waist, then lifted out
    #    toward the suitors). The suitors at the tables turn to watch her.
    penelope_bow = load("sprites/npcs/penelope/penelope_bow_s.png")

    def bow_brought(t: int) -> Image.Image:
        img = scene(t)
        put(img, throne, 120, 82)
        lifted = t >= ANIMS["bow_brought"][0] // 2
        put(img, cell(penelope_bow, 1 if lifted else 0, 0), 120, 104)
        for i, (x, sheet, row) in enumerate(((50, antinous, E), (74, extras[0], E), (168, eurymachus, W), (194, extras[1], W))):
            put(img, idle(sheet, row, t, i), x, 120)
        put(img, banquet, 28, 74)
        put(img, banquet, 212, 74)
        return grade(img, dim=FLICKER[t % 8])

    # 2. Telemachus walks down the hall, setting the twelve axes in a line
    #    as he goes, then turns to look along the row of rings.
    def axes(t: int) -> Image.Image:
        img = scene(t)
        for i, (x, sheet) in enumerate(((60, extras[2]), (92, amphinomus), (150, extras[3]), (182, extras[4]))):
            put(img, idle(sheet, S, t, i), x, 82)
        intro = ANIMS["axes"][0]
        start, end = 228, 34
        x = round(start + (end - start) * min(t, intro - 1) / (intro - 1))
        xs = [48 + i * 13 for i in range(12)]
        for ax in xs:
            if ax > x + 4:  # he has already passed this spot
                axe(img, ax, 108)
        if t < intro:
            put(img, cell(telemachus_walk, t % 8, W), x, 118)
        else:
            axe(img, xs[0], 108)
            put(img, idle(telemachus, E, t), x, 118)
        return grade(img, dim=FLICKER[t % 8])

    # 3. A suitor leans on the bow with all his weight. It barely bends,
    #    he shakes with the effort, the others laugh.
    def suitors_fail(t: int) -> Image.Image:
        img = scene(t)
        shake = (0, 1, 0, -1)[t % 4]
        put(img, idle(extras[5], E, 0), 98 + shake, 104)
        bending_bow(img, 109 + shake, 78, 100, (0, 1, 2, 2, 2, 1, 0, 0)[t])
        drop = t % 4
        sweat(img, 92 + shake, 76 + drop)
        sweat(img, 104 + shake, 74 + (drop + 2) % 4)
        for i, (x, sheet, row) in enumerate(((44, extras[0], E), (64, extras[1], E), (150, antinous, W))):
            # Laughing: a little bob up and down.
            put(img, idle(sheet, row, t, i), x, 112 - ((t + i) // 2) % 2)
        axes_row(img, 168, 6, 112, count=8)
        return grade(img, dim=FLICKER[t % 8])

    # 4. Antinous warms the bow over the fire, turning it in his hands.
    def hearth_scene(t: int) -> Image.Image:
        img = scene(t)
        put(img, cell(hearth, t % 4, 0, 48, 32), 120, 102)
        lift = (0, 0, -1, -1, -1, 0, 0, 0)[t]
        for x in range(100, 141):
            y = 82 + lift + ((x - 120) ** 2) // 120
            img.putpixel((x, y), WOOD)
            img.putpixel((x, y + 1), WOOD_DARK)
        put(img, idle(antinous, E, t), 86, 104 + lift)
        put(img, idle(eurymachus, W, t, 1), 156, 104)
        sweat(img, 152, 76 + t % 4)
        return grade(img, tint=(214, 150, 100), dim=FLICKER[(t * 3) % 8] * 1.02)

    # 5. The beggar asks to try, the bow in his hand. The suitors jeer,
    #    Penelope watches from above.
    def beggar_scene(t: int, frame: Image.Image) -> Image.Image:
        img = scene(t)
        put(img, frame, 70, 108)
        for i, (x, sheet) in enumerate(((150, antinous), (176, eurymachus), (202, extras[2]))):
            put(img, idle(sheet, W, t, i), x, 104 - ((t + i) // 2) % 2)
        put(img, idle(penelope, S, t), 120, 74)
        return grade(img, dim=FLICKER[t % 8])

    # 6. He strings it as a singer strings a lyre: he raises the bow and
    #    draws the empty string back to test it, then lowers it.
    string_steps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 9, 10, 11, 12, 12]

    def string_scene(t: int) -> Image.Image:
        intro = ANIMS["string"][0]
        frame = cell(no_arrow, string_steps[t], 0) if t < intro else bow_rest(t)
        return beggar_scene(t, frame)

    # 7. The shot. The beggar at the left draws to full and lets go on the
    #    fifth frame (0.5 s), when the CSS arrow starts flying through the
    #    rings. Put at cx=24, bottom=106: the LPC arrow lies on y=90 with its
    #    point at x=36, the same spot the CSS arrow starts from.
    shot_steps = [5, 6, 7, 8, 9, 10, 11, 12]

    def shot(t: int, steps=shot_steps) -> Image.Image:
        img = scene(t)
        floor = 90 + AXE_RING_DY
        axes_row(img, 64, 13, floor)
        for i, (x, sheet) in enumerate(((90, extras[0]), (130, antinous), (170, extras[3]))):
            put(img, idle(sheet, S, t, i), x, 70)
        intro = ANIMS["shot"][0]
        frame = cell(with_arrow if steps[min(t, intro - 1)] < 9 else no_arrow, steps[t], 0) if t < intro else bow_rest(t)
        put(img, frame, 24, 106)
        return grade(img, dim=FLICKER[t % 8])

    # 8. He throws off his rags and leaps to the doorway, shooting. The
    #    suitors scramble for their spears.
    turn_steps = [4, 6, 8, 8, 9, 10, 12, 12]

    def turn(t: int) -> Image.Image:
        img = scene(t)
        step = turn_steps[t]
        put(img, cell(with_arrow if step < 9 else no_arrow, step, 0), 52, 108)
        for i, (x, y, sheet) in enumerate(((140, 98, antinous), (166, 110, eurymachus), (190, 96, amphinomus), (210, 114, extras[1]))):
            row = W if (t // 2 + i) % 3 else SW
            put(img, idle(sheet, row, t, i), x + (1 if (t + i) % 2 else -1), y)
        put(img, banquet, 212, 74)
        return grade(img, tint=(220, 140, 110), dim=FLICKER[t % 8])

    def frames(name: str, draw) -> list[Image.Image]:
        return [draw(t) for t in range(sum(ANIMS[name]))]

    save_scene("bow_brought", frames("bow_brought", bow_brought))
    save_scene("axes", frames("axes", axes))
    save_scene("suitors_fail", frames("suitors_fail", suitors_fail))
    save_scene("hearth", frames("hearth", hearth_scene))
    save_scene("beggar", frames("beggar", lambda t: beggar_scene(t, bow_rest(t))))
    save_scene("string", frames("string", string_scene))
    shots = frames("shot", shot)
    save_scene("shot", shots)
    # The still behind the questions is him at full draw, the arrow on the string.
    grade_full = shot(0, steps=[8])
    grade_full.save(CONTEST / "shot.png")
    save_scene("turn", frames("turn", turn))
    print("ring line in shot.png: y =", 90, "of", H2, f"({90 / H2 * 100:.1f}%)")


if __name__ == "__main__":
    build_arrow()
    build_backdrop()
    build_contest()
    print("Wrote the arrow, hall backdrop, and contest pictures.")
