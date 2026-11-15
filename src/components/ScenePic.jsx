import { useEffect, useState } from 'react';

// One animated cutscene picture (the contest of the bow and the ending).
//
// Each picture is a strip of 240 x 135 frames side by side in
// public/assets/contest/<name>_anim.png, made by art/scripts/build_hall_contest.py
// and build_ending.py. The strip starts with an intro that plays once (a walk,
// the draw of the bow) and ends with a loop that repeats (breathing, firelight).
//
// ANIMS must match ANIMS in build_hall_contest.py: [intro frames, loop frames].

const FPS = 8;
export const ANIMS = {
  bow_brought: [8, 8],
  axes: [32, 8],
  suitors_fail: [0, 8],
  hearth: [0, 8],
  beggar: [0, 8],
  string: [16, 8],
  shot: [8, 8],
  turn: [0, 8],
  chamber: [0, 8],
  embrace: [24, 8],
  dawn: [0, 8],
};

const still = (name) => `/assets/contest/${name}.png`;
const strip = (name) => `/assets/contest/${name}_anim.png`;

// Load the strips before they are needed, so no picture shows up blank.
export function preloadScenes(names) {
  names.forEach((name) => {
    const img = new Image();
    img.src = ANIMS[name] ? strip(name) : still(name);
  });
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// settled: the previous caption showed the same picture, so skip the intro
// and go straight to the loop (Penelope does not walk in twice).
export default function ScenePic({ name, settled = false }) {
  const anim = ANIMS[name];
  const [intro, loop] = anim || [0, 1];
  const total = intro + loop;
  const [frame, setFrame] = useState(() => (settled || reducedMotion() ? total - 1 : 0));

  useEffect(() => {
    if (!anim || reducedMotion()) return undefined;
    let t = settled ? intro : 0;
    setFrame(t);
    const timer = setInterval(() => {
      t += 1;
      // After the intro, keep cycling through the loop frames.
      if (t >= total) t = intro;
      setFrame(t);
    }, 1000 / FPS);
    return () => clearInterval(timer);
  }, [name, settled, anim, intro, total]);

  if (!anim) return <img className="l2-contest-pic" src={still(name)} alt="" />;
  return (
    <div
      className="l2-contest-pic is-anim"
      role="presentation"
      style={{
        backgroundImage: `url(${strip(name)})`,
        backgroundSize: `${total * 100}% 100%`,
        backgroundPositionX: total > 1 ? `${(frame / (total - 1)) * 100}%` : '0%',
      }}
    />
  );
}
