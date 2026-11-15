# Credits

## Odysseus (LPC walk, idle, attack, and hit)

`public/assets/sprites/odysseus_idle.png` and `public/assets/sprites/odysseus_walk.png` are composed from [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) layers (commit `04140673ec02906f8233523639733c83690df750`). Rebuild them with `python3 art/scripts/build_odysseus_lpc.py` (needs Pillow).

The idle sheet is 256×32: eight frames of 32×32, one facing each, south, south-east, east, north-east, north, north-west, west, south-west. The walk sheet is 2048×32: eight stepping frames of each facing, in that same order. LPC draws four directions, so south-east and north-east reuse east, and south-west and north-west reuse west. Frames are half of the 64×64 LPC cell, nearest-neighbor, feet on the bottom row, origin bottom-center.

Animated actions use the same pinned layers and palette swaps. Rebuild them with
`python art/scripts/build_odysseus_actions.py` (Pillow required):

- `odysseus_idle_animation.png`: 512�32, two breathing frames per facing.
- `odysseus_attack.png`: 3072�64, six overhead downward-swing frames per facing (LPC slash frames reversed, 5 through 0). The 64px cell leaves space for the weapon; the body remains 32px, centered in the cell.
- `odysseus_hit.png`: 768�32, three frames per facing (LPC hurt frames 0, 1, 0). The original hurt art only faces south. All facings reuse this short standing flinch instead of the falling/death frames.

The overhead-swing sword uses `weapon/sword/arming/attack_slash/bg/steel.png` and
`weapon/sword/arming/attack_slash/fg/steel.png`; its authors and OGA-BY 3.0
license are listed under Sword below. The other action layers use the same
paths below with `idle`, `slash`, or `hurt` in place of `walk`. Source layers
are checked in under `art/lpc/layers/` so the build can be reproduced offline.

The stacked look follows the dark-armor reference: light skin, a gray beard, a charcoal cape, charcoal pants, leather sandals, an iron plate cuirass, iron bracers, an iron legion helmet, a scarlet legion crest, and a steel arming sword carried at the hip. Beard, cape, pants, sandals, armor, helmet, and crest are palette swaps of the generator's ULPC rows. The crest uses a brighter scarlet than the stock cloth-red row so it still reads red at 32px.

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

### Beard — `beards/beard/basic`

Recolored from the ULPC orange row to gray.

- Authors: JaidynReiman, Carlo Enrico Victoria (Nemisys)
- Licenses: CC-BY-SA 3.0, GPL 3.0
- Notes: original by Nemisys, repositioning by JaidynReiman.
- https://opengameart.org/content/lpc-white-beard

### Cape — `cape/solid`, foreground and background

Recolored from the white cloth row to charcoal.

- Authors: bluecarrot16, JaidynReiman
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more
- https://opengameart.org/content/lpc-roman-armor
- http://opengameart.org/content/lpc-clothing-updates

### Pants — `legs/pants/male`

Recolored from the white cloth row to charcoal.

- Authors: bluecarrot16, JaidynReiman, ElizaWy, Matthew Krohn (makrohn), Johannes Sjölund (wulax), Stephen Challener (Redshrike)
- Licenses: OGA-BY 3.0, GPL 3.0, CC-BY-SA 3.0
- Notes: original male pants by wulax, recolors and edits to v3 base by bluecarrot16, climb/jump/run/sit/emotes/revised combat by JaidynReiman based on ElizaWy's LPC Revised.
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- https://opengameart.org/content/lpc-expanded-pants

### Cuirass — `torso/armour/plate/male`

Recolored from the steel row to iron.

- Authors: Napsio (Vitruvian Studio), JaidynReiman, bluecarrot16, Michael Whitlock (bigbeargames), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- Notes: original by wulax, recolor by bigbeargames, color reduced and adapted to v3 bases by bluecarrot16, run/jump/sit/climb/revised combat by JaidynReiman.
- https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- https://opengameart.org/content/lpc-combat-armor-for-women

### Bracers — `arms/bracers/male`

Recolored from the steel row to iron.

- Authors: Matthew Krohn (makrohn), Johannes Sjölund (wulax), JaidynReiman
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- Notes: original by wulax, adjustments by Makrohn, climb/emote/jump/sit/run by JaidynReiman.
- https://opengameart.org/content/lpc-medieval-fantasy-character-sprites

### Sandals — `feet/sandals/male`

Recolored from the ULPC white cloth row to leather.

- Authors: Nila122, JaidynReiman, Matthew Krohn (makrohn), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- Notes: edited for v3 bases by bluecarrot16. Jump/sit/emote/run/revised combat by JaidynReiman.
- https://opengameart.org/content/lpc-roman-armor
- http://opengameart.org/content/lpc-clothing-updates
- https://opengameart.org/content/lpc-expanded-socks-shoes

### Helmet — `hat/helmet/legion/adult`

Recolored from the ULPC steel row to iron. This is a legion galea, the closest dark cheek-guard helmet in the pack.

- Authors: bluecarrot16, Nila122, JaidynReiman, Matthew Krohn (makrohn), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- https://opengameart.org/content/lpc-roman-armor
- https://opengameart.org/content/lpc-expanded-hats-facial-helmets

### Crest — `hat/accessory/plumage_legion`

Recolored from the brown cloth row to scarlet.

- Authors: bluecarrot16, Nila122, JaidynReiman, Matthew Krohn (makrohn), Johannes Sjölund (wulax)
- Licenses: OGA-BY 3.0, CC-BY-SA 3.0, GPL 2.0, GPL 3.0
- https://opengameart.org/content/lpc-roman-armor
- https://opengameart.org/content/lpc-helmets-mega-pack
- https://opengameart.org/content/lpc-expanded-hats-facial-helmets

### Sword — `weapon/sword/arming`, steel, foreground and background

- Authors: ElizaWy, with walk and down by JaidynReiman
- Licenses: OGA-BY 3.0
- https://github.com/ElizaWy/LPC/tree/main/Characters/Props/Sword%2001%20-%20Arming%20Sword
- https://opengameart.org/content/lpc-expanded-sit-run-jump-more

License texts: [CC-BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), [GPL 2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html), [OGA-BY 3.0](https://static.opengameart.org/OGA-BY-3.0.txt).

## Other sprites

The Greek and Trojan idle sheets and the Trojan horse were made in PixelLab by the Ohmyssey team. The soldiers are still idle only. The scene bobs those frames while a warrior moves.

- `public/assets/sprites/soldier_red_greek.png` — the Greek army. Red crests, same as Odysseus.
- `public/assets/sprites/soldier_teal_trojan.png` — the Trojan army. Teal.
- `public/assets/sprites/trojan_horse.png` — 1024×128, eight frames of 128×128 in the same facing order. The plaza shows the south frame.

Each soldier sheet is 256×32: eight frames of 32×32, one facing each, in the same order as Odysseus. `WARRIOR_CONFIG` in `src/game/warriorConfig.js` is where a walk sheet for them would plug in.

## Scenery

The beach, wall, temple, houses, lamps, and props are drawn in code (`src/game/textures.js`). No downloaded tileset. `src/game/warriorArt.js` is only a fallback for a team whose sprite path is empty.

## Fonts

Cinzel and Source Sans 3 are loaded from Google Fonts, the same way the rest of Ohmyssey already does.

## Greek and Trojan soldiers (LPC idle, walk, spear thrust, and hit)

Everything in `public/assets/sprites/npcs/greek_lpc/` and `public/assets/sprites/npcs/trojan_lpc/` is composed from the same Universal LPC generator commit as Odysseus. Rebuild with `python3 art/scripts/build_soldiers_lpc.py` (needs Pillow). The script header lists every output sheet and its layout.

Greeks: light skin, linen pants, leather sandals, a bronze plate cuirass, bronze bracers, a bronze legion helmet, a dull maroon legion crest, a bronze spear, and a Spartan shield. Trojans: the same body and head, a barbuta helmet, and a ridge crest, with armor, helmet, crest, shield, spear and clothes all recolored to one dark gray ramp. The recolors are palette swaps of the generator's rows.

Layer credits, from the generator's CREDITS.csv:

- `shield/spartan/bg`: by bluecarrot16,Sander Frenken (castelonia). Licenses: OGA-BY 3.0. Sources: https://opengameart.org/content/lpc-shields
- `weapon/polearm/spear/background`: by Pierre Vigier (pvigier),Johannes Sjölund (wulax),Inboxninja. Licenses: CC-BY-SA 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-spear-and-shovel-reworked Notes: original by wulax, walk animations redone by pvigier, split into layers and tweaked for v3 character bases by bluecarrot16
- `body/bodies/male`: by bluecarrot16,JaidynReiman,Benjamin K. Smith (BenCreating),Evert,Eliza Wyatt (ElizaWy),TheraHedwig,MuffinElZangano,Durrani,Johannes Sjölund (wulax),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-male-jumping-animation-by-durrani, https://opengameart.org/content/lpc-runcycle-and-diagonal-walkcycle, https://opengameart.org/content/lpc-revised-character-basics, https://opengameart.org/content/lpc-be-seated, https://opengameart.org/content/lpc-runcycle-for-male-muscular-and-pregnant-character-bases-with-modular-heads, https://opengameart.org/content/lpc-jump-expanded, https://opengameart.org/content/lpc-character-bases Notes: see details at https://opengameart.org/content/lpc-character-bases; 'Thick' Male Revised Run/Climb by JaidynReiman (based on ElizaWy's LPC Revised)
- `feet/sandals/male`: by Nila122,JaidynReiman,Matthew Krohn (makrohn),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-roman-armor, http://opengameart.org/content/lpc-clothing-updates, https://opengameart.org/content/lpc-expanded-socks-shoes Notes: edited for v3 bases by bluecarrot16, Jump/Sit/Emote/Run/Revised Combat by JaidynReiman
- `legs/pants/male`: by bluecarrot16,JaidynReiman,ElizaWy,Matthew Krohn (makrohn),Johannes Sjölund (wulax),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,GPL 3.0,CC-BY-SA 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-expanded-pants Notes: original male pants by wulax, recolors and edits to v3 base by bluecarrot16, climb/jump/run/sit/emotes/revised combat by JaidynReiman based on ElizaWy's LPC Revised
- `torso/armour/plate/male`: by Napsio (Vitruvian Studio),JaidynReiman,bluecarrot16,Michael Whitlock (bigbeargames),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-combat-armor-for-women Notes: original by wulax, recolor by bigbeargames, color reduced to 7 colors and adapted to v3 bases by bluecarrot16, run/jump/sit/climb/revised combat by JaidynReiman, reduced colors to 6 (based on Napsio's Vitruvian)
- `arms/bracers/male`: by Matthew Krohn (makrohn),Johannes Sjölund (wulax),JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites Notes: original by wulax, adjustments by Makrohn, climb/emote/jump/sit/run by JaidynReiman
- `head/heads/human/male`: by bluecarrot16,Benjamin K. Smith (BenCreating),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-character-bases Notes: original head by Redshrike, tweaks by BenCreating, modular version by bluecarrot16
- `hat/helmet/legion/adult`: by bluecarrot16,Nila122,JaidynReiman,Matthew Krohn (makrohn),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-roman-armor, https://opengameart.org/content/lpc-expanded-hats-facial-helmets
- `hat/accessory/plumage_legion/adult`: by bluecarrot16,Nila122,JaidynReiman,Matthew Krohn (makrohn),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-roman-armor, https://opengameart.org/content/lpc-helmets-mega-pack, https://opengameart.org/content/lpc-expanded-hats-facial-helmets
- `shield/spartan/fg`: by bluecarrot16,Sander Frenken (castelonia). Licenses: OGA-BY 3.0. Sources: https://opengameart.org/content/lpc-shields
- `weapon/polearm/spear/foreground`: by Pierre Vigier (pvigier),Johannes Sjölund (wulax),Inboxninja. Licenses: CC-BY-SA 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-spear-and-shovel-reworked Notes: original by wulax, walk animations redone by pvigier, split into layers and tweaked for v3 character bases by bluecarrot16
- `hat/helmet/barbuta/male`: by bluecarrot16. Licenses: OGA-BY 3.0,CC-BY 3.0,CC-BY 4.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-helmets, https://opengameart.org/content/lpc-expanded-hats-facial-helmets
- `hat/accessory/crest/adult`: by bluecarrot16. Licenses: OGA-BY 3.0. Sources: https://opengameart.org/content/lpc-helmets, https://opengameart.org/content/lpc-expanded-hats-facial-helmets

## Eumaeus and the suitors (LPC idle, Ithaca)

`public/assets/sprites/npcs/eumaeus/eumaeus_32.png` and everything in `public/assets/sprites/npcs/suitor_lpc/` are composed from the same Universal LPC generator commit. Rebuild with `python3 art/scripts/build_ithaca_people_lpc.py` (needs Pillow). Every cloth and hair layer is recolored by lightness onto the ramps named in that script.

Layer credits, from the generator's CREDITS.csv:

- `cape/tattered/bg`: by Nila122,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor
- `body/bodies/male`: by bluecarrot16,JaidynReiman,Benjamin K. Smith (BenCreating),Evert,Eliza Wyatt (ElizaWy),TheraHedwig,MuffinElZangano,Durrani,Johannes Sjölund (wulax),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-male-jumping-animation-by-durrani, https://opengameart.org/content/lpc-runcycle-and-diagonal-walkcycle, https://opengameart.org/content/lpc-revised-character-basics, https://opengameart.org/content/lpc-be-seated, https://opengameart.org/content/lpc-runcycle-for-male-muscular-and-pregnant-character-bases-with-modular-heads, https://opengameart.org/content/lpc-jump-expanded, https://opengameart.org/content/lpc-character-bases
- `feet/sandals/male`: by Nila122,JaidynReiman,Matthew Krohn (makrohn),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-roman-armor, http://opengameart.org/content/lpc-clothing-updates, https://opengameart.org/content/lpc-expanded-socks-shoes
- `legs/skirts/plain/male`: by bluecarrot16,Pierre Vigier (pvigier),Johannes Sjölund (wulax),Ahmad3366,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- `torso/clothes/longsleeve/longsleeve/male`: by JaidynReiman,Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, http://opengameart.org/content/lpc-clothing-updates, https://opengameart.org/content/lpc-revised-character-basics, https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing, https://opengameart.org/content/lpc-expanded-sit-run-jump-more, https://opengameart.org/content/lpc-expanded-simple-shirts
- `cape/tattered/fg`: by Nila122,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor
- `head/heads/human/male_elderly`: by Benjamin K. Smith (BenCreating),Eliza Wyatt (ElizaWy),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-revised-elders, https://opengameart.org/content/lpc-character-bases
- `beards/beard/5oclock_shadow`: by JaidynReiman,Thane Brimhall (pennomi),laetissima. Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-base-character-expressions
- `hair/unkempt/adult`: by JaidynReiman,Manuel Riecke (MrBeast). Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-expanded-hair
- `cape/solid/bg`: by Nila122,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor
- `torso/clothes/shortsleeve/shortsleeve/male`: by bluecarrot16,ElizaWy,JaidynReiman,Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, http://opengameart.org/content/lpc-revised-character-basics, http://opengameart.org/content/lpc-clothing-updates, https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing, https://opengameart.org/content/lpc-expanded-sit-run-jump-more, https://opengameart.org/content/lpc-expanded-simple-shirts
- `cape/solid/fg`: by bluecarrot16,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor, http://opengameart.org/content/lpc-clothing-updates
- `cape/trim`: by bluecarrot16,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, http://opengameart.org/content/lpc-clothing-updates
- `head/heads/human/male`: by bluecarrot16,Benjamin K. Smith (BenCreating),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-character-bases
- `hair/curly_short/adult`: by ElizaWy. Licenses: OGA-BY 3.0. Sources: https://opengameart.org/content/lpc-hair, https://opengameart.org/content/lpc-expanded-sit-run-jump-more
- `torso/clothes/longsleeve/longsleeve2_vneck/male`: by ElizaWy,JaidynReiman,Stephen Challener (Redshrike),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0. Sources: http://opengameart.org/content/lpc-revised-character-basics, https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing, https://opengameart.org/content/lpc-expanded-sit-run-jump-more, https://opengameart.org/content/lpc-expanded-simple-shirts
- `torso/waist/obi/male`: by JaidynReiman. Licenses: OGA-BY 3.0+,CC-BY 3.0+,GPL 3.0. Sources: https://opengameart.org/content/lpc-kimono-relm
- `hair/parted/adult`: by JaidynReiman,Joe White,Manuel Riecke (MrBeast). Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://github.com/jrconway3/Universal-LPC-spritesheet/commit/46ddcf05a0e43e7aa6ffd47d350eef0eb529ac24, https://opengameart.org/content/lpc-expanded-hair
- `torso/clothes/sleeveless/sleeveless2_scoop/male`: by ElizaWy,JaidynReiman,Stephen Challener (Redshrike),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0. Sources: http://opengameart.org/content/lpc-revised-character-basics, https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing, https://opengameart.org/content/lpc-expanded-sit-run-jump-more, https://opengameart.org/content/lpc-expanded-simple-shirts
- `beards/beard/trimmed`: by ElizaWy. Licenses: OGA-BY 3.0. Sources: https://github.com/ElizaWy/LPC/tree/main/Characters/Hair, https://opengameart.org/content/lpc-expanded-sit-run-jump-more
- `hair/swoop/adult`: by JaidynReiman,Manuel Riecke (MrBeast). Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-expanded-hair

## Odysseus as the beggar (LPC, Ithaca)

Everything in `public/assets/sprites/odysseus_beggar/` is composed from the same Universal LPC generator commit, following Odyssey 13 (bald, withered, a filthy smoke-stained tunic, a bald deer hide, a staff). Rebuild with `python3 art/scripts/build_odysseus_beggar_lpc.py` (needs Pillow).

Layer credits, from the generator's CREDITS.csv:

- `cape/tattered/bg`: by Nila122,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor
- `body/bodies/male`: by bluecarrot16,JaidynReiman,Benjamin K. Smith (BenCreating),Evert,Eliza Wyatt (ElizaWy),TheraHedwig,MuffinElZangano,Durrani,Johannes Sjölund (wulax),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, https://opengameart.org/content/lpc-male-jumping-animation-by-durrani, https://opengameart.org/content/lpc-runcycle-and-diagonal-walkcycle, https://opengameart.org/content/lpc-revised-character-basics, https://opengameart.org/content/lpc-be-seated, https://opengameart.org/content/lpc-runcycle-for-male-muscular-and-pregnant-character-bases-with-modular-heads, https://opengameart.org/content/lpc-jump-expanded, https://opengameart.org/content/lpc-character-bases
- `feet/sandals/male`: by Nila122,JaidynReiman,Matthew Krohn (makrohn),Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 2.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-roman-armor, http://opengameart.org/content/lpc-clothing-updates, https://opengameart.org/content/lpc-expanded-socks-shoes
- `legs/skirts/plain/male`: by bluecarrot16,Pierre Vigier (pvigier),Johannes Sjölund (wulax),Ahmad3366,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites
- `torso/clothes/longsleeve/longsleeve/male`: by JaidynReiman,Johannes Sjölund (wulax). Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-medieval-fantasy-character-sprites, http://opengameart.org/content/lpc-clothing-updates, https://opengameart.org/content/lpc-revised-character-basics, https://github.com/ElizaWy/LPC/tree/main/Characters/Clothing, https://opengameart.org/content/lpc-expanded-sit-run-jump-more, https://opengameart.org/content/lpc-expanded-simple-shirts
- `cape/tattered/fg`: by Nila122,JaidynReiman. Licenses: OGA-BY 3.0,CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-curly-hair-elven-ears-white-cape-with-blue-trim-and-more, https://opengameart.org/content/lpc-roman-armor
- `head/heads/human/male_elderly`: by Benjamin K. Smith (BenCreating),Eliza Wyatt (ElizaWy),Stephen Challener (Redshrike). Licenses: OGA-BY 3.0,CC-BY 3.0. Sources: https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles, https://opengameart.org/content/lpc-revised-elders, https://opengameart.org/content/lpc-character-bases
- `beards/beard/basic`: by JaidynReiman,Carlo Enrico Victoria (Nemisys). Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-white-beard
- `hair/balding/adult`: by ElizaWy. Licenses: OGA-BY 3.0. Sources: https://opengameart.org/content/lpc-hair
- `weapon/polearm/cane/male`: by bluecarrot16. Licenses: CC-BY-SA 3.0,GPL 3.0. Sources: https://opengameart.org/content/lpc-gentleman
