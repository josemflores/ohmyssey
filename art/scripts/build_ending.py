#!/usr/bin/env python3
"""Paint the pictures for the end of the game (Odyssey 23).

Penelope tests the stranger: she asks the nurse to move the great bed out
of their chamber. Odysseus answers that no one can move it, because he
built it himself around the trunk of a living olive tree. Only he could
know that, and she runs to him. Athena holds back the dawn so their night
lasts long.

  public/assets/contest/chamber.png   the bedchamber and the olive-tree bed
  public/assets/contest/embrace.png   Penelope and Odysseus together
  public/assets/contest/dawn.png      Ithaca at dawn

Same 240 x 135 pixel pictures as the contest of the bow, built from the
game's own sprites. Run from the repo root (needs Pillow):

  python3 art/scripts/build_ending.py
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw

from build_hall_contest import CONTEST, W as WEST, E as EAST, cell, grade, hall_scene, load, put

W2, H2, WALL = 240, 135, 46
BARK = (98, 84, 66, 255)
BARK_DARK = (58, 48, 38, 255)
BARK_LIGHT = (138, 122, 98, 255)
LEAVES = [(62, 84, 48, 255), (84, 108, 60, 255), (112, 134, 78, 255)]
FRAME = (110, 64, 30, 255)
FRAME_DARK = (58, 32, 16, 255)
LINEN = (236, 226, 204, 255)
LINEN_SHADE = (204, 190, 164, 255)
SPREAD = (150, 40, 34, 255)
SPREAD_DARK = (104, 26, 22, 255)
GOLD = (217, 163, 90, 255)


def olive_trunk(img: Image.Image, x: int, bottom: int) -> None:
    """A gnarled olive trunk from the floor up through the ceiling."""
    d = ImageDraw.Draw(img)
    for y in range(0, bottom + 1):
        sway = round(2 * math.sin(y / 9))
        w = 7 if y > bottom - 10 else 5
        left = x + sway - w // 2
        d.line((left, y, left + w, y), fill=BARK)
        img.putpixel((left, y), BARK_DARK)
        img.putpixel((left + w, y), BARK_DARK)
        if y % 5 == 0:
            img.putpixel((left + 2, y), BARK_LIGHT)
    # Two branches reaching out under the roof.
    for sx, dx in ((-1, -1), (1, 1)):
        bx = x + 3 * sx
        for i in range(18):
            img.putpixel((bx + dx * i, 20 - i // 3), BARK_DARK)
            img.putpixel((bx + dx * i, 21 - i // 3), BARK)


def leaves(img: Image.Image, cx: int, cy: int, rx: int, ry: int, seed: int) -> None:
    rnd = random.Random(seed)
    for _ in range(rx * ry):
        a = rnd.random() * math.tau
        r = math.sqrt(rnd.random())
        x = round(cx + math.cos(a) * rx * r)
        y = round(cy + math.sin(a) * ry * r)
        if 0 <= x < img.width and 0 <= y < img.height:
            img.putpixel((x, y), rnd.choice(LEAVES))
            if x + 1 < img.width:
                img.putpixel((x + 1, y), rnd.choice(LEAVES))


def bed(img: Image.Image, x0: int, top: int, width: int, post_x: int) -> None:
    """The bed, seen from the side, with its head post built on the trunk."""
    d = ImageDraw.Draw(img)
    floor = top + 26
    # Frame and legs.
    d.rectangle((x0, top + 12, x0 + width, top + 18), fill=FRAME)
    d.line((x0, top + 18, x0 + width, top + 18), fill=FRAME_DARK)
    for lx in (x0 + 2, x0 + width - 3):
        d.rectangle((lx, top + 18, lx + 2, floor), fill=FRAME_DARK)
    # Inlay of gold along the side, as in the poem (gold, silver, ivory).
    for gx in range(x0 + 6, x0 + width - 4, 6):
        img.putpixel((gx, top + 15), GOLD)
    # Mattress, the red spread, pillow.
    d.rectangle((x0 + 1, top + 3, x0 + width - 3, top + 12), fill=LINEN)
    d.line((x0 + 1, top + 12, x0 + width - 3, top + 12), fill=LINEN_SHADE)
    d.rectangle((x0 + 18, top + 1, x0 + width - 3, top + 11), fill=SPREAD)
    d.line((x0 + 18, top + 11, x0 + width - 3, top + 11), fill=SPREAD_DARK)
    for fx in range(x0 + 19, x0 + width - 3, 3):
        img.putpixel((fx, top + 12), GOLD)
    d.rectangle((x0 + 4, top - 1, x0 + 15, top + 4), fill=LINEN)
    d.line((x0 + 4, top + 4, x0 + 15, top + 4), fill=LINEN_SHADE)
    # The footboard, and the head post carved from the olive trunk itself.
    d.rectangle((x0 + width - 2, top - 2, x0 + width + 2, floor), fill=FRAME)
    d.line((x0 + width + 2, top - 2, x0 + width + 2, floor), fill=FRAME_DARK)
    img.putpixel((x0 + width, top - 3), GOLD)
    d.rectangle((post_x - 3, top - 10, post_x + 3, floor), fill=BARK)
    d.line((post_x - 3, top - 10, post_x - 3, floor), fill=BARK_DARK)
    d.line((post_x - 1, top - 6, post_x - 1, top + 8), fill=BARK_LIGHT)


def chamber(odysseus_x: int, penelope_x: int, glow: bool) -> Image.Image:
    img = hall_scene(W2, H2, WALL, 1)
    olive_trunk(img, 70, 104)
    leaves(img, 70, 14, 46, 14, 3)
    bed(img, 74, 76, 84, 71)
    king = load("sprites/odysseus_idle.png")
    penelope = load("sprites/npcs/penelope/penelope_sheet.png")
    put(img, cell(penelope, 0, EAST), penelope_x, 118)
    # The king's sheet is one row of eight facings: S, SE, E, NE, N, NW, W, SW.
    put(img, cell(king, 6, 0), odysseus_x, 118)
    tint = (230, 170, 120) if glow else (188, 150, 120)
    out = grade(img, tint=tint)
    if glow:
        # Lamplight around the two of them.
        px = out.load()
        cx = (odysseus_x + penelope_x) / 2
        for y in range(H2):
            for x in range(W2):
                d = math.hypot((x - cx) / 60, (y - 104) / 40)
                if d < 1:
                    r, g, b, a = px[x, y]
                    k = 1 + 0.35 * (1 - d)
                    px[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k * 0.92)), a)
    return out


def dawn() -> Image.Image:
    img = Image.new("RGBA", (W2, H2), (0, 0, 0, 255))
    px = img.load()
    sky = [(14, 20, 52), (46, 40, 92), (132, 74, 112), (232, 136, 98), (252, 196, 120)]
    horizon = 84
    bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
    for y in range(horizon):
        t = y / horizon * (len(sky) - 1)
        i = min(int(t), len(sky) - 2)
        f = t - i
        for x in range(W2):
            # A 2D ordered dither between the two nearest sky colours.
            c = sky[i + 1] if f > (bayer[y % 4][x % 4] + 0.5) / 16 else sky[i]
            px[x, y] = (*c, 255)
    d = ImageDraw.Draw(img)
    # The sun, held just under the sea by Athena.
    d.ellipse((164, horizon - 10, 196, horizon + 22), fill=(255, 222, 150, 255))
    # Sea with glints.
    d.rectangle((0, horizon, W2, H2), fill=(30, 48, 82, 255))
    rnd = random.Random(7)
    for _ in range(90):
        x, y = rnd.randrange(W2), rnd.randrange(horizon + 2, H2)
        near = abs(x - 180) < 30 - (y - horizon) // 3
        d.line((x, y, x + rnd.randint(2, 6), y), fill=(255, 210, 140, 255) if near else (88, 116, 150, 255))
    # Ithaca: a dark island, the palace on its hill with lit windows.
    d.polygon([(0, 96), (20, 86), (46, 74), (70, 66), (92, 68), (116, 82), (140, 100), (160, 112), (160, 135), (0, 135)], fill=(20, 22, 30, 255))
    d.rectangle((52, 54, 94, 68), fill=(28, 28, 38, 255))
    d.polygon([(48, 54), (73, 44), (98, 54)], fill=(28, 28, 38, 255))
    for wx in (58, 66, 80, 88):
        d.rectangle((wx, 59, wx + 2, 62), fill=(255, 196, 110, 255))
    # Stars fading in the west.
    for _ in range(30):
        x, y = rnd.randrange(W2), rnd.randrange(0, 30)
        if x < 160:
            px[x, y] = (220, 220, 240, 255)
    return img


def main() -> None:
    CONTEST.mkdir(parents=True, exist_ok=True)
    chamber(176, 40, glow=False).save(CONTEST / "chamber.png")
    chamber(132, 116, glow=True).save(CONTEST / "embrace.png")
    dawn().save(CONTEST / "dawn.png")
    print("Wrote chamber, embrace and dawn.")


if __name__ == "__main__":
    main()
