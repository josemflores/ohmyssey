import { useEffect, useState } from 'react';
import './Credits.css';

// The end of the game: the credits roll up over a starry night sky, then
// "Back to the title". Full artist and license details are in CREDITS.md.

const TEAM = [
  { name: 'Kevin Pham', role: 'Game world: maps, movement, camera, characters' },
  { name: 'Skand Maharjan', role: 'Screens and learning: title, HUD, Athena, puzzles' },
  { name: 'Jose Manuel Perez Flores', role: 'Levels, questions, Athena, art and maps' },
  { name: 'Jonathan Nouman', role: 'The road home: Ithaca, the hut, the story' },
];

const LPC_ARTISTS = [
  'bluecarrot16', 'Benjamin K. Smith (BenCreating)', 'Carlo Enrico Victoria (Nemisys)', 'Durrani',
  'Eliza Wyatt (ElizaWy)', 'Evert', 'JaidynReiman', 'Johannes Sjölund (wulax)', 'Matthew Krohn (makrohn)',
  'Michael Whitlock (bigbeargames)', 'MuffinElZangano', 'Napsio (Vitruvian Studio)', 'Nila122',
  'Stephen Challener (Redshrike)', 'TheraHedwig',
];

export default function Credits({ onHome }) {
  const [rolled, setRolled] = useState(false);

  // The roll takes about 40 s; the buttons wait at the end. Enter skips.
  useEffect(() => {
    const timer = setTimeout(() => setRolled(true), 40000);
    function onKey(event) {
      if (event.key === 'Enter' || event.key === ' ') setRolled(true);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="credits" role="dialog" aria-label="Credits" data-rolled={rolled ? '1' : '0'}>
      <div className="credits-sky" aria-hidden="true" />
      <div className={`credits-roll${rolled ? ' is-done' : ''}`}>
        <p className="credits-the-end">The End</p>
        <h1 className="credits-title">Ohmyssey</h1>
        <p className="credits-sub">A journey home, one circuit at a time</p>
        <div className="credits-rule" aria-hidden="true" />

        <section>
          <h2>Made by</h2>
          {TEAM.map((person) => (
            <p key={person.name} className="credits-person">
              <strong>{person.name}</strong>
              <span>{person.role}</span>
            </p>
          ))}
        </section>

        <section>
          <h2>The story</h2>
          <p>After Homer, <em>The Odyssey</em></p>
          <p className="credits-small">The fall of Troy, the voyage home, the beggar in the hut, the contest of the bow, and the secret of the olive-tree bed.</p>
        </section>

        <section>
          <h2>Characters</h2>
          <p>Liberated Pixel Cup (LPC) and the Universal LPC Spritesheet Character Generator</p>
          <p className="credits-small credits-names">{LPC_ARTISTS.join(' · ')}</p>
          <p className="credits-small">Shared under CC-BY-SA 3.0, GPL 3.0 and OGA-BY 3.0. Full details in CREDITS.md.</p>
        </section>

        <section>
          <h2>Art and scenery</h2>
          <p>Troy, Ithaca, the hall, the contest pictures and the battle scenes, painted by the Ohmyssey team in code and pixels</p>
        </section>

        <section>
          <h2>Athena</h2>
          <p>Answers questions with Google Gemini</p>
        </section>

        <section>
          <h2>Type</h2>
          <p>Cinzel, Cormorant Garamond and Source Sans 3, from Google Fonts</p>
        </section>

        <section>
          <h2>Built with</h2>
          <p>React, Phaser and Vite</p>
          <p className="credits-small">Made at HackUTA</p>
        </section>

        <div className="credits-rule" aria-hidden="true" />
        <p className="credits-thanks">Thank you for playing.</p>
      </div>
      <div className={`credits-actions${rolled ? ' is-shown' : ''}`}>
        {!rolled && (
          <button type="button" className="credits-btn is-quiet" onClick={() => setRolled(true)}>Skip</button>
        )}
        {rolled && (
          <button type="button" className="credits-btn" onClick={() => onHome?.()} autoFocus>
            Back to the title
          </button>
        )}
      </div>
    </div>
  );
}
