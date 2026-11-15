# Credits

## Odysseus

`public/assets/sprites/odysseus_idle.png` is the idle sheet made for this project in PixelLab. It is 256×32: eight frames of 32×32, one facing each, in this order: south, south-east, east, north-east, north, north-west, west, south-west.

The bottom of that file did not decode (the stream stops a few rows early). The picture in the repo keeps the recovered frames and adds a two-pixel sandal so Odysseus stands on the ground instead of floating. Drop in a fresh export of the same sheet and it will replace this one; the frame order does not need to change.

There is no walk cycle yet. The game bobs that idle frame. See `ANIM_CONFIG` in `src/game/animConfig.js` for where a walk sheet plugs in.

## Scenery

The beach, wall, temple, houses, horse, props, and both armies are drawn in code (`src/game/textures.js` and `src/game/warriorArt.js`). No downloaded tileset. Greeks wear teal. Trojans wear crimson.

## Fonts

Cinzel and Source Sans 3 are loaded from Google Fonts, the same way the rest of Ohmyssey already does.
