# Ohmyssey

**Sail from Troy to Ithaca. The only way home is electronics.**

Ohmyssey is a browser game built at hackUTA (Nov 14–15, 2026). You play Odysseus from the fall of Troy to his reunion with Penelope, and every door, every fight, and the contest of the bow is won by answering a circuit question. Athena, powered by Google Gemini, gives hints but never the answer.

**Play:** [ohmyssey.study](https://ohmyssey.study) · **Devpost:** [devpost.com/software/ohmyssey](https://devpost.com/software/ohmyssey)

## How it plays

Log in, use Google, or press **Skip**. A few story cards and a quick tip on Lessons and Athena lead into the game.

**Level 1 · Troy**
- Start hidden inside the wooden horse. Answer a question at the trap door to climb out.
- Answer at the city gate to burst it open, and the Greek army pours in.
- Beat three groups of Trojans in turn-based battles. **Light Attack** asks an easier question. **Heavy Attack** asks a harder one and hits every Trojan. Miss, and a Trojan strikes back.
- Follow the Greeks to the ship, choose Ithaca on the journey map, and sail.

**Level 2 · Ithaca**
- Wake on the beach. Athena appears and disguises you as a beggar (*Odyssey*, Book 13).
- Shelter with Eumaeus the swineherd, where Telemachus joins you.
- Answer at the hall doors, then win the **contest of the bow**: three right answers in a row send the arrow through all twelve axes (Book 21).
- Fight the twelve suitors, each named from Homer (Book 22).
- Penelope tests you with the secret of your bed (Book 23). Then the credits roll.

Troy's questions cover voltage, current, resistance, Ohm's law, series and parallel, switches, and LED direction. Ithaca adds capacitors and inductors. Answers are graded by code with exact formulas, not by the AI.

### Controls

| Key | Action |
| --- | --- |
| W A S D / arrow keys | Walk |
| Shift | Run |
| E | Interact at a "Press E" spot |
| H | Ask Athena |
| L | Lessons |
| Esc | Close a panel, or open the menu |

The menu has brightness, larger text, and your name. Turning on **Dev mode** there adds level skipping, reset, and hitboxes.

## Athena and the lessons

**Athena (H)** answers questions in character. Ask for a puzzle's answer and she points you at the idea instead. She runs on `gemini-3.5-flash-lite` through a Vercel serverless function, so the API key never reaches the browser. Requests are capped and rate-limited, and if Gemini is unavailable she answers from the lesson notes, so the game keeps working.

**Lessons (L)** open a book for each level with five tabs: Overview (from Greek amber to Volta and Faraday), Concepts, Equations, Examples, and Practice. Troy's practice puzzle is the beach lamp's closed loop. Ithaca's is a 555 timer lighthouse:

```
f ≈ 1.44 / ((R1 + 2·R2) × C)      R1 = 1 kΩ, R2 = 68 kΩ, C = 10 µF  →  about 1 Hz
```

## Run it locally

You need [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/josemflores/ohmyssey.git
cd ohmyssey
npm install
npm run dev
```

Open http://localhost:5173. To hear Athena live, copy `.env.example` to `.env.local`, add a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey), and restart. Never give the key a `VITE_` prefix.

```bash
npm test        # checks the circuit math, answer keys, lessons, and Athena helper
npm run build   # builds the site into dist/
```

Shortcuts: `?level2` opens Ithaca directly, and `?level2&skip=hall|contest|battle|won` jumps to that part of it. `?journeymap` opens the map.

Optional variables: `GEMINI_MODEL` (override the model), `VITE_GOOGLE_CLIENT_ID` (Google sign-in), `VITE_LEVELS_API_URL` (where to load the lesson pack).

## Deploy

Import the repo into [Vercel](https://vercel.com) with the **Vite** preset (`npm run build`, output `dist`), add `GEMINI_API_KEY`, and deploy. The functions in `api/` deploy with it.

## Built with

React 18, Vite, Phaser 3, Vercel, and the Google Gemini API.

- **Art:** characters are composed from open-source [LPC](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) sprite layers by our Python scripts in `art/scripts/`. The soldier sheets and the Trojan horse were made in PixelLab. Authors and licenses are in [CREDITS.md](CREDITS.md).
- **Music and sound:** synthesized by `art/scripts/build_audio.py`, with no samples.
- **AI tools:** Jarvis (Grok Bot) helped plan, and Cursor and Claude Code agents helped build. See [AI_TEAM.md](AI_TEAM.md) and the team rules in [AGENTS.md](AGENTS.md).

## Team

Jose Manuel Perez Flores · Kevin Pham · Skand Maharjan · Jonathan Nouman


## License

[MIT](LICENSE). Sprite art keeps its own licenses; see [CREDITS.md](CREDITS.md).
