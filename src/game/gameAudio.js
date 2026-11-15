const AUDIO_PATH = import.meta.env.BASE_URL + 'assets/audio/';
const COMBAT = 'combat-trojan-charge';
const FOOTSTEPS = ['footstep', 'footstep-2', 'footstep-3'];

function audioClip(name, volume, loop = false) {
  const clip = new Audio(AUDIO_PATH + name + '.wav');
  clip.volume = volume;
  clip.loop = loop;
  return clip;
}

export function attachGameAudio(game, { world, level }) {
  const effects = new Map();
  const playing = new Set();
  let worldTrack = audioClip(world, 0.26, true);
  const combatTrack = audioClip(COMBAT, 0.29, true);
  const doorTrack = audioClip('door-the-gates-of-troy', 0.43);
  let activeTrack = worldTrack;

  function startMusic() {
    if (activeTrack.paused) activeTrack.play().catch(() => {});
  }

  function useTrack(track) {
    if (track === activeTrack) return;
    activeTrack.pause();
    activeTrack = track;
    startMusic();
  }

  function play(name, volume = 0.46) {
    if (!effects.has(name)) effects.set(name, audioClip(name, volume));
    const voice = effects.get(name).cloneNode();
    voice.volume = volume;
    playing.add(voice);
    const clear = () => {
      voice.removeEventListener('ended', clear);
      voice.removeEventListener('error', clear);
      playing.delete(voice);
    };
    voice.addEventListener('ended', clear);
    voice.addEventListener('error', clear);
    voice.play().catch(clear);
  }

  let nextStep = 0;
  let stepIndex = 0;
  function footsteps(time, moving, running) {
    if (!moving || time < nextStep) return;
    nextStep = time + (running ? 220 : 335);
    play(FOOTSTEPS[stepIndex], running ? 0.36 : 0.31);
    stepIndex = (stepIndex + 1) % FOOTSTEPS.length;
  }

  function doorOpening() {
    if (activeTrack === combatTrack || activeTrack === doorTrack) return;
    doorTrack.currentTime = 0;
    useTrack(doorTrack);
  }

  function finishDoorCue() {
    if (activeTrack === doorTrack) useTrack(worldTrack);
  }

  doorTrack.addEventListener('ended', finishDoorCue);
  doorTrack.addEventListener('error', finishDoorCue);

  function fightStart() {
    if (activeTrack === combatTrack) return;
    combatTrack.currentTime = 0;
    useTrack(combatTrack);
  }

  function fightBlow({ damage, heavy, splash, blocked }) {
    play('attack-swing', 0.36);
    if (blocked) play('hit-block');
    else if (damage > 0) play(heavy || splash ? 'hit-heavy' : 'hit-light');
  }

  function leaveHorse(place) {
    if (place !== 'troy') return;
    const nextTrack = audioClip('world-harbor', 0.26, true);
    const wasExploring = activeTrack === worldTrack;
    worldTrack = nextTrack;
    if (wasExploring) useTrack(nextTrack);
  }

  const events = {
    audioStep: footsteps,
    audioDoorOpen: doorOpening,
    audioCombatStart: fightStart,
    audioCombatEnd: () => useTrack(worldTrack),
    fightBlow,
    audioBlow: fightBlow,
    gameOver: () => useTrack(worldTrack),
    audioSelect: () => play('ui-select', 0.28),
    audioTransition: () => play('world-transition', 0.33),
    ...(level === 'troy' ? {
      place: leaveHorse,
      interact: () => play('interact', 0.32),
      hatchQuestion: () => play('interact', 0.32),
      gateQuestion: () => play('interact', 0.32),
      gatePick: () => play('ui-select', 0.28),
      fightAttack: () => play('ui-select', 0.28),
      fightStart,
      fightEnd: () => useTrack(worldTrack),
    } : {
      talk: () => play('interact', 0.32),
      hallDoor: () => play('interact', 0.32),
      bowFound: () => play('pickup', 0.44),
    }),
  };
  for (const [name, handler] of Object.entries(events)) game.events.on(name, handler);
  window.addEventListener('keydown', startMusic);
  window.addEventListener('pointerdown', startMusic);
  game.events.once('destroy', () => {
    window.removeEventListener('keydown', startMusic);
    window.removeEventListener('pointerdown', startMusic);
    doorTrack.removeEventListener('ended', finishDoorCue);
    doorTrack.removeEventListener('error', finishDoorCue);
    for (const [name, handler] of Object.entries(events)) game.events.off(name, handler);
    activeTrack.pause();
    for (const voice of playing) voice.pause();
    playing.clear();
  });
  startMusic();
}
