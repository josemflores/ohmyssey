/**
 * One line of the battle log, on a bronze plaque above the fighters:
 * "[helmet] Trojan sentry strikes ⚔ 2". It has its own row in the battle
 * grid, so it never sits on the turn chips or the health bars.
 *
 * Remount it (change its key) for each blow: it fades and slides in over
 * 150 ms, holds, then fades out after about 1.5 s.
 */

import './BattleLog.css';

export default function BattleLog({ log, note, fresh }) {
  const show = fresh && (log || note);
  return (
    <div className="battle-log-row" aria-live="polite">
      {show && (
        <p className={`battle-log is-${log?.who || 'plain'}`}>
          {log ? <LogLine log={log} /> : note}
        </p>
      )}
    </div>
  );
}

function LogLine({ log }) {
  const trojan = log.who === 'trojan';
  const missed = !log.damage;
  return (
    <>
      <Helmet crest={trojan ? '#3fb4a8' : '#d9534f'} />
      <span className={`battle-log-name ${trojan ? 'is-trojan' : 'is-greek'}`}>{log.name}</span>
      <span className="battle-log-act">{missed ? 'misses' : log.action}</span>
      {!missed && (
        <b className={`battle-log-dmg ${trojan ? 'is-trojan' : 'is-greek'}`}>
          <span aria-hidden="true">⚔ </span>
          <span className="sr-only">for </span>
          {log.damage}
        </b>
      )}
      {log.splash > 0 && !missed && (
        <span className="battle-log-splash">
          + <b className="battle-log-dmg is-greek"><span aria-hidden="true">⚔ </span>{log.splash}</b> next foe
        </span>
      )}
    </>
  );
}

// A Corinthian helmet in profile with a horsehair crest. Greek crests are
// red, Trojan crests teal, matching the sprites.
function Helmet({ crest }) {
  return (
    <svg className="battle-log-helmet" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 9 C3 3 8 1 12 2 C9 2 6 4 5 8 Z" fill={crest} />
      <path d="M4 9 C4 5 7 3.5 10.5 3.5 C14.5 3.5 17 6.5 17 10.5 L17 15 L13.5 15 L13.5 11.5 L11 11.5 L11 17 L6 17 C4.6 17 4 16 4 14.5 Z" fill="#c9a24a" stroke="#1a1208" strokeWidth="0.8" />
      <path d="M12 8 L16 8 L16 10 L12 10 Z" fill="#1a1208" />
      <path d="M2 9 C4 5.5 8 2.5 13 2.5" fill="none" stroke={crest} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
