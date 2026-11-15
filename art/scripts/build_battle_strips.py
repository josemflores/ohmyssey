"""Cut single-facing battle strips out of the full LPC action sheets.

The battle screen only ever shows Odysseus facing east and the Trojans
facing west. The full sheets hold all 8 facings, and CSS scales the whole
sheet up to show one cell. At battle size Odysseus's attack sheet came out
about 19,000 CSS px wide, roughly 38,000 real px on a 2x display, past the
largest texture a browser will draw (often 8,192 to 16,384). The browser
then draws nothing, so he vanished mid-attack. These strips hold only the
frames the battle uses, so even at 4x on a 2x screen the widest is ~3,000 px.

Run after rebuilding the sheets:
    python3 art/scripts/build_battle_strips.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public" / "assets" / "sprites"
OUT = ROOT / "public" / "assets" / "battle"

# Facing order in every sheet: s, se, e, ne, n, nw, w, sw.
EAST = 2
WEST = 6

# (source sheet, cell size, frames per facing, facing, first frame offset,
#  frame count, output name)
STRIPS = [
    ("odysseus_idle_animation.png", 32, 2, EAST, 0, 2, "odysseus_idle_e.png"),
    ("odysseus_attack.png", 64, 6, EAST, 0, 6, "odysseus_attack_e.png"),
    ("odysseus_hit.png", 32, 3, EAST, 0, 3, "odysseus_hit_e.png"),
    ("npcs/trojan_lpc/trojan_idle_animation.png", 32, 2, WEST, 0, 2, "trojan_idle_w.png"),
    ("npcs/trojan_lpc/trojan_attack.png", 32, 6, WEST, 0, 6, "trojan_attack_w.png"),
    # The hurt strip keeps the frames the battle already showed (0-2).
    ("npcs/trojan_lpc/trojan_hit.png", 32, 3, 0, 0, 3, "trojan_hit.png"),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for source, cell, per_facing, facing, offset, count, name in STRIPS:
        sheet = Image.open(SPRITES / source).convert("RGBA")
        first = facing * per_facing + offset
        strip = Image.new("RGBA", (cell * count, cell), (0, 0, 0, 0))
        for i in range(count):
            x = (first + i) * cell
            strip.paste(sheet.crop((x, 0, x + cell, cell)), (i * cell, 0))
        strip.save(OUT / name)
        print(f"{name}: {strip.width}x{strip.height} from {source} frames {first}-{first + count - 1}")


if __name__ == "__main__":
    main()
