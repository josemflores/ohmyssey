#!/usr/bin/env python3
"""Recolor two existing NPC sheets for the swineherd's hut.

Aeolus (old, bearded) becomes Eumaeus in a rough brown cloak.
The lantern crewman (young) becomes Telemachus in travel clothes.
Frame size and layout stay 32×32, eight directions, four frames each.

Run from the repo root:

  python3 art/scripts/build_hut_npcs.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
NPCS = ROOT / "public" / "assets" / "sprites" / "npcs"

CLOAK = ((118, 86, 58), (86, 62, 42), (146, 112, 78), (98, 90, 80))
HAIR = (62, 44, 30)
SKIN = (214, 170, 132)
BEARD = (186, 178, 168)
LAMP = (196, 150, 72)


def near(c, target, tol=28):
    return all(abs(a - b) <= tol for a, b in zip(c, target))


def paint_eumaeus(r, g, b, y):
    # The white robe and the white beard share a color. The beard sits on
    # the face; the robe is the body below it.
    if r > 220 and g > 210 and b > 200:
        if y < 11:
            return (232, 206, 176, 255)
        if y < 18:
            return (*BEARD, 255)
        return (*CLOAK[(y + r) % 4], 255)
    if near((r, g, b), (232, 184, 140), 36) or near((r, g, b), (214, 184, 138), 30):
        return (*SKIN, 255)
    if r > 170 and g > 140 and b < 160:
        return (120, 86, 48, 255)
    if max(r, g, b) < 40:
        return (28, 20, 14, 255)
    return (r, g, b, 255)


def paint_telemachus(r, g, b, y):
    # Sailor blue becomes a traveler's brown. The cap becomes dark hair.
    if b > r + 20 and b > 50 and r < 120:
        if y < 12:
            return (*HAIR, 255)
        shade = CLOAK[min(3, b // 40)]
        return (*shade, 255)
    if near((r, g, b), (232, 184, 140), 36):
        return (*SKIN, 255)
    if r > 180 and g > 140 and b < 170:
        return (*LAMP, 255)
    if max(r, g, b) < 40:
        return (24, 16, 12, 255)
    return (r, g, b, 255)


def convert(src: Path, dest: Path, paint) -> None:
    image = Image.open(src).convert("RGBA")
    pix = image.load()
    w, h = image.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if not a:
                continue
            pix[x, y] = paint(r, g, b, y % 32)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest)
    print(dest.relative_to(ROOT), image.size)


def main() -> None:
    convert(NPCS / "aeolus" / "aeolus_32.png", NPCS / "eumaeus" / "eumaeus_32.png", paint_eumaeus)
    convert(
        NPCS / "crew_lantern" / "crew_lantern_32.png",
        NPCS / "telemachus" / "telemachus_32.png",
        paint_telemachus,
    )


if __name__ == "__main__":
    main()
