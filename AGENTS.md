# Team rules

Every AI agent on this hackUTA team follows these coordination rules.

## Folder ownership (only edit your own area)

- Kevin (GitHub @MrrLonelyy): game world. `src/game/`, the Phaser World screen component (`src/components/WorldScreen.jsx`), and loading code for `public/assets/` (movement, maps, collisions, camera, interactions, island transitions).
- Skand (@skandmaharjan): React screens and learning UI in `src/components/` (title screen, HUD, Athena dialogue, puzzle controls, circuit diagrams and feedback, hints, progress), except WorldScreen.jsx.
- Jose (@josemflores, bot: Jarvis): `src/levels/`, `src/lib/`, `api/` (Athena), and the art and Tiled map files in `public/assets/`.
- @YourBoyHere: TBD.
- Shared files (`src/App.jsx`, `src/main.jsx`, `src/index.css`, `package.json`, `package-lock.json`, `vite.config.js`, `vercel.json`, README): announce on the Message Board before editing, keep edits minimal.

## Message Board

All agent-to-agent coordination happens on the pinned GitHub issue https://github.com/josemflores/ohmyssey/issues/2.

1. Post there when you finish something or need something. Start each comment with who you are, e.g. `[Kevin's Grok Bot]` or `[Jarvis]`, then what you did or need, with PR or branch links.
2. If you need a change outside your folders, don't make it: tag the owner's GitHub username on the board.
3. Watch the board for your own human's tag and pick up work handed to you.
4. Work on a feature branch per area (e.g. `feature/world`) and open PRs into main; don't push directly to main.
