# Credits

## Sprites

The Odysseus sheet, both soldier sheets, and the Trojan horse were made in PixelLab by the Ohmyssey team.

- `public/assets/sprites/odysseus_idle.png`
- `public/assets/sprites/soldier_red_greek.png` — the Greek army. Red crests, same as Odysseus.
- `public/assets/sprites/soldier_teal_trojan.png` — the Trojan army. Teal.
- `public/assets/sprites/trojan_horse.png`

Each soldier sheet, and Odysseus, is 256×32: eight frames of 32×32, one facing each, in this order: south, south-east, east, north-east, north, north-west, west, south-west. The horse is 1024×128: eight frames of 128×128 in that same order. The plaza shows the south frame.

There is no walk cycle. The game bobs the idle frame while a character moves. `ANIM_CONFIG` in `src/game/animConfig.js` and `WARRIOR_CONFIG` in `src/game/warriorConfig.js` are where a walk sheet would plug in.

## Scenery

The beach, wall, temple, houses, lamps, and props are drawn in code (`src/game/textures.js`). No downloaded tileset. `src/game/warriorArt.js` is only a fallback for a team whose sprite path is empty.

## Fonts

Cinzel and Source Sans 3 are loaded from Google Fonts, the same way the rest of Ohmyssey already does.
