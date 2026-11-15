# Credits

## Odysseus (LPC walk and idle)

`public/assets/sprites/odysseus_idle.png` and `public/assets/sprites/odysseus_walk.png` are composed from [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) layers (commit `04140673ec02906f8233523639733c83690df750`). Rebuild them with `python3 art/scripts/build_odysseus_lpc.py` (needs Pillow).

The idle sheet is 256×32: eight frames of 32×32, one facing each, south, south-east, east, north-east, north, north-west, west, south-west. The walk sheet is 2048×32: eight stepping frames of each facing, in that same order. LPC draws four directions, so south-east and north-east reuse east, and south-west and north-west reuse west. Frames are half of the 64×64 LPC cell, nearest-neighbor, feet on the bottom row, origin bottom-center.

The stacked look is a light-skinned man, short light-brown hair, a light-brown beard, a white sleeveless tunic, a white legion skirt (pteruges), leather sandals, a bronze legion helmet, a bronze spear, and a Spartan shield. Hair, beard, sandals, and the helmet are palette swaps of the generator's official ULPC rows (orange hair to light brown, white cloth to leather, steel to bronze).

Each layer keeps its own authors and license. The composed sheets are a derivative, so share them under CC-BY-SA 3.0 and GPL 3.0 together, with this attribution.

### Body — `body/bodies/male`

Light skin, the colors already in the sheet.

- Authors: bluecarrot16, JaidynReiman, Benjamin K. Smith (BenCreating), Evert, Eliza Wyatt (ElizaWy), TheraHedwig, MuffinElZangano, Durrani, Johannes Sjölund (wulax), Stephen Challener (Redshrike)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- Notes: see https://opengameart.org/content/lpc-character-bases. "Thick" male revised run/climb by JaidynReiman (based on ElizaWy's LPC Revised).
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- https://opengameart.org/content/lpc-male-jumping-animation-by-durrani
- https://opengameart.org/content/lpc-runcycle-and-diagonal-walkcycle
- https://opengameart.org/content/lpc-revised-character-basics
- https://opengameart.org/content/lpc-be-seated
- https://opengameart.org/content/lpc-runcycle-for-male-muscular-and-pregnant-character-bases-with-modular-heads
- https://opengameart.org/content/lpc-jump-expanded
- https://opengameart.org/content/lpc-character-bases

### Head — `head/heads/human/male`

Light skin. The eyes are drawn on this sheet.

- Authors: bluecarrot16, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- Notes: original head by Redshrike, tweaks by BenCreating, modular version by bluecarrot16.
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/lpc-character-bases

### Hair — `hair/plain`

Short hair. Recolored from the ULPC orange row to light brown.

- Authors: JaidynReiman, Manuel Riecke (MrBeast), Joe White
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/ponytail-and-plain-hairstyles
- https://opengameart.org/content/lpc-expanded-hair

### Beard — `beards/beard/basic`

Recolored from the ULPC orange row to light brown.

- Authors: JaidynReiman, Carlo Enrico Victoria (Nemisys)
- Licenses: CC-BY-SA 3.0, GPL 3.0
- Notes: original by Nemisys, repositioning by JaidynReiman.
- https://opengameart.org/content/lpc-white-beard

### Tunic — `torso/clothes/sleeveless/sleeveless/male`, white

- Authors: bluecarrot16, Matthew Krohn (makrohn), JaidynReiman, Marcel van de Steeg (MadMarcel), Nila122, Johannes Sjölund (wulax), Stephen Challener (Redshrike)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- https://opengameart.org/content/lpc-female-orcogregoblintroll-base-walkcycle
- https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more
- https://opengameart.org/content/more-lpc-clothes-and-hair
- https://opengameart.org/content/lpc-pirates

### Legion skirt — `legs/skirts/legion/male`

White cloth palette (the generator's white row, with its gray fold shades and a small gold stripe).

- Authors: bluecarrot16, Nila122, JaidynReiman
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- Notes: original by Nila122, adapted to v3 bases by bluecarrot16, climb/jump/sit/run by JaidynReiman.
- https://opengameart.org/content/lpc-roman-armor
- http://opengameart.org/content/lpc-clothing-updates
- https://opengameart.org/content/lpc-expanded-armour

### Sandals — `feet/sandals/male`

Recolored from the ULPC white cloth row to leather.

- Authors: Nila122, JaidynReiman, Matthew Krohn (makrohn), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- Notes: edited for v3 bases by bluecarrot16. Jump/sit/emote/run/revised combat by JaidynReiman.
- https://opengameart.org/content/lpc-roman-armor
- http://opengameart.org/content/lpc-clothing-updates
- https://opengameart.org/content/lpc-expanded-socks-shoes

### Helmet — `hat/helmet/legion/adult`

Recolored from the ULPC steel row to bronze. This is a legion galea, the closest bronze ancient helmet in the pack (there is no Corinthian helmet).

- Authors: bluecarrot16, Nila122, JaidynReiman, Matthew Krohn (makrohn), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- https://opengameart.org/content/lpc-roman-armor
- https://opengameart.org/content/lpc-expanded-hats-facial-helmets

### Spear — `weapon/polearm/spear`, bronze, foreground and background

- Authors: Pierre Vigier (pvigier), Johannes Sjölund (wulax), Inboxninja
- Licenses: CC-BY-SA 3.0
- Notes: original by wulax, walk animations redone by pvigier, split into layers and tweaked for v3 bases by bluecarrot16.
- https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- https://opengameart.org/content/lpc-spear-and-shovel-reworked

### Shield — `shield/spartan`, foreground and background

- Authors: bluecarrot16, Sander Frenken (castelonia)
- Licenses: OGA-BY 3.0
- https://opengameart.org/content/lpc-shields

License texts: [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), [GPL 2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html), [OGA-BY 3.0](https://static.opengameart.org/OGA-BY-3.0.txt).

## Other sprites

The Greek and Trojan idle sheets were made in PixelLab by the Ohmyssey team. They are still idle only. The scene bobs those frames while a warrior moves.

- `public/assets/sprites/greek_idle.png`
- `public/assets/sprites/trojan_idle.png`

Each of those sheets is 256×32: eight frames of 32×32, one facing each, in the same order as Odysseus. `WARRIOR_CONFIG` in `src/game/warriorConfig.js` is where a walk sheet for them would plug in.

## Scenery

The beach, wall, temple, houses, horse, and props are drawn in code (`src/game/textures.js`). No downloaded tileset. `src/game/warriorArt.js` is only a fallback for a team whose sprite path is empty.

## Fonts

Cinzel and Source Sans 3 are loaded from Google Fonts, the same way the rest of Ohmyssey already does.
