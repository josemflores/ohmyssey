#!/usr/bin/env python3
"""Paint the pictures for the end of the game (Odyssey 23).

Penelope tests the stranger: she asks the nurse to move the great bed out
of their chamber. Odysseus answers that no one can move it, because he
built it himself around the trunk of a living olive tree. Only he could
know that, and she runs to him. Athena holds back the dawn so their night
lasts long.

  public/assets/contest/chamber.png   the bedchamber and the olive-tree bed
  public/assets/contest/embrace.png   Penelope and Odysseus walk to each other
  public/assets/contest/dawn.png      Ithaca at dawn

Same 240 x 135 pixel pictures as the contest of the bow, built from the
game's own LPC sprites (Penelope, and Odysseus still in his beggar's rags),
and animated the same way: each also gets a <name>_anim.png strip. Run from the repo root (needs Pillow):

  python3 art/scripts/build_ending.py
"""

from __future__ import annotations

import math
import random

from PIL import Image, ImageDraw

from build_hall_contest import ANIMS, CONTEST, FLICKER, E as EAST, cell, grade, hall_scene, idle, load, put, save_scene

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


PENELOPE = load("sprites/npcs/penelope/penelope_sheet.png")
PENELOPE_WALK = load("sprites/npcs/penelope/penelope_walk_32.png")
# The LPC beggar's sheets list the facings s se e ne n nw w sw, so west is
# facing 6: idle_animation columns 12-13, walk columns 48-55.
BEGGAR_IDLE = load("sprites/odysseus_beggar/idle_animation.png")
BEGGAR_WALK = load("sprites/odysseus_beggar/walk.png")


def chamber(t: int, odysseus_x: int, penelope_x: int, glow: float, walking: bool = False) -> Image.Image:
    """The bedchamber at frame t. glow (0 to 0.35) is the lamplight around
    the two of them; walking shows both mid-stride toward each other."""
    img = hall_scene(W2, H2, WALL, 1)
    olive_trunk(img, 70, 104)
    leaves(img, 70, 14, 46, 14, 3)
    bed(img, 74, 76, 84, 71)
    if walking:
        put(img, cell(PENELOPE_WALK, t % 8, EAST), penelope_x, 118)
        put(img, cell(BEGGAR_WALK, 48 + t % 8, 0), odysseus_x, 118)
    else:
        put(img, idle(PENELOPE, EAST, t), penelope_x, 118)
        put(img, cell(BEGGAR_IDLE, 12 + (t // 4) % 2, 0), odysseus_x, 118)
    # From the cold grey of the test to warm lamplight.
    k = glow / 0.35
    tint = tuple(round(a + (b - a) * k) for a, b in zip((188, 150, 120), (230, 170, 120)))
    out = grade(img, tint=tint, dim=FLICKER[t % 8])
    if glow > 0:
        # Lamplight around the two of them.
        px = out.load()
        cx = (odysseus_x + penelope_x) / 2
        for y in range(H2):
            for x in range(W2):
                d = math.hypot((x - cx) / 60, (y - 104) / 40)
                if d < 1:
                    r, g, b, a = px[x, y]
                    m = 1 + glow * (1 - d)
                    px[x, y] = (min(255, int(r * m)), min(255, int(g * m)), min(255, int(b * m * 0.92)), a)
    return out


def embrace(t: int) -> Image.Image:
    """Her knees give way and she runs to him; he comes to meet her. Then
    they stand together in the lamplight, which slowly breathes."""
    intro = ANIMS["embrace"][0]
    if t < intro:
        f = t / (intro - 1)
        return chamber(t, round(176 - 42 * f), round(40 + 76 * f), 0.35 * f, walking=True)
    pulse = 0.35 + 0.04 * math.sin(t / LOOP_LEN * math.tau)
    return chamber(t, 134, 116, pulse)


LOOP_LEN = ANIMS["chamber"][1]


def dawn(t: int = 0) -> Image.Image:
    """Ithaca at dawn, frame t: the sea glitters, the last stars twinkle,
    the palace lamps flicker. The sun stays put: Athena holds it back."""
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
    for i in range(90):
        x, y = rnd.randrange(W2), rnd.randrange(horizon + 2, H2)
        length = rnd.randint(2, 6)
        if (i + t) % 3 == 0:
            continue  # this glint is between waves
        near = abs(x - 180) < 30 - (y - horizon) // 3
        drift = (t // 2 + i) % 3 - 1  # the water moves a little
        d.line((x + drift, y, x + drift + length, y), fill=(255, 210, 140, 255) if near else (88, 116, 150, 255))
    # Ithaca: a dark island, the palace on its hill with lit windows.
    d.polygon([(0, 96), (20, 86), (46, 74), (70, 66), (92, 68), (116, 82), (140, 100), (160, 112), (160, 135), (0, 135)], fill=(20, 22, 30, 255))
    d.rectangle((52, 54, 94, 68), fill=(28, 28, 38, 255))
    d.polygon([(48, 54), (73, 44), (98, 54)], fill=(28, 28, 38, 255))
    for i, wx in enumerate((58, 66, 80, 88)):
        lit = (255, 196, 110, 255) if (t + i * 3) % 7 else (220, 150, 80, 255)
        d.rectangle((wx, 59, wx + 2, 62), fill=lit)
    # Stars fading in the west.
    for i in range(30):
        x, y = rnd.randrange(W2), rnd.randrange(0, 30)
        if x < 160 and (i + t // 2) % 4:
            px[x, y] = (220, 220, 240, 255)
    return img


def main() -> None:
    CONTEST.mkdir(parents=True, exist_ok=True)
    save_scene("chamber", [chamber(t, 176, 40, 0.0) for t in range(sum(ANIMS["chamber"]))])
    save_scene("embrace", [embrace(t) for t in range(sum(ANIMS["embrace"]))])
    save_scene("dawn", [dawn(t) for t in range(sum(ANIMS["dawn"]))])
    print("Wrote chamber, embrace and dawn.")


if __name__ == "__main__":
    main()
