// The game's sound, on the Web Audio API: gapless music loops that crossfade,
// a war cue when the gates of Troy open, footsteps and effects.
//
// Music and cues are made by art/scripts/build_audio.py (Greek modes, lyre,
// aulos, frame drums, war drums, horns, choir). Each loop file carries one
// extra second; audioManifest.json gives the loop length, so the loop runs
// sample-accurately from loopStart to loopStart + length.
//
// The scenes and screens only emit events on game.events (audioStep,
// audioDoorOpen, audioCombatStart, ...). Nothing else needs to know about
// audio. Browsers start audio only after a key or a click, so the context
// resumes on the first one.

import manifest from './audioManifest.json';

const AUDIO_PATH = import.meta.env.BASE_URL + 'assets/audio/';
const FILES = {
  'music-troy-night': 'music-troy-night.mp3',
  'music-troy-war': 'music-troy-war.mp3',
  'music-combat': 'music-combat.mp3',
  'music-ithaca': 'music-ithaca.mp3',
  'cue-war': 'cue-war.mp3',
  'door-hatch': 'door-hatch.mp3',
  'door-hall': 'door-hall.mp3',
};
const STEPS = ['step-1', 'step-2', 'step-3', 'step-4'];
// How loud each piece sits in the mix (the files differ in density).
const MUSIC_GAIN = {
  'music-troy-night': 0.5,
  'music-troy-war': 0.5,
  'music-combat': 0.42,
  'music-ithaca': 0.55,
};

let sharedContext = null;
function audioContext() {
  if (sharedContext) return sharedContext;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  sharedContext = new Ctx();
  return sharedContext;
}

// Decoded buffers are shared between games (a restart reuses them).
const buffers = new Map();
function loadBuffer(ctx, name) {
  if (buffers.has(name)) return buffers.get(name);
  const file = FILES[name] || `${name}.wav`;
  const promise = fetch(AUDIO_PATH + file)
    .then((res) => {
      if (!res.ok) throw new Error(`${file}: ${res.status}`);
      return res.arrayBuffer();
    })
    .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
    .catch(() => null);
  buffers.set(name, promise);
  return promise;
}

// Where the music really starts: some browsers keep the MP3 encoder's
// leading silence when they decode, some trim it.
function leadingSilence(buffer) {
  const data = buffer.getChannelData(0);
  const limit = Math.min(data.length, Math.floor(buffer.sampleRate * 0.12));
  for (let i = 0; i < limit; i += 1) {
    if (Math.abs(data[i]) > 0.0005) return i / buffer.sampleRate;
  }
  return 0;
}

export function attachGameAudio(game, { level }) {
  const ctx = audioContext();
  if (!ctx) return;
  let alive = true;

  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  const musicBus = ctx.createGain();
  musicBus.connect(out);
  const sfxBus = ctx.createGain();
  sfxBus.connect(out);

  const troy = level === 'troy';
  let place = troy ? 'horse' : 'ithaca';
  let worldName = troy ? 'music-troy-night' : 'music-ithaca';
  let wanted = worldName;
  let current = null; // { name, source, gain }
  let cue = null;

  const preload = troy
    ? ['music-troy-night', 'music-troy-war', 'music-combat', 'cue-war', 'door-hatch']
    : ['music-ithaca', 'music-combat', 'door-hall'];
  for (const name of [...preload, ...STEPS]) loadBuffer(ctx, name);

  // ---- Music ----

  function fadeOut(voice, seconds) {
    if (!voice) return;
    const now = ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
    try {
      voice.source.stop(now + seconds + 0.05);
    } catch {
      // Already stopped.
    }
  }

  async function playMusic(name, fade = 1.6) {
    wanted = name;
    if (current && current.name === name) return;
    const buffer = await loadBuffer(ctx, name);
    if (!alive || !buffer || wanted !== name || (current && current.name === name)) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const start = leadingSilence(buffer);
    const loop = manifest.loops[name];
    if (loop) {
      source.loop = true;
      source.loopStart = start;
      source.loopEnd = Math.min(buffer.duration, start + loop);
    }
    const gain = ctx.createGain();
    const level = MUSIC_GAIN[name] ?? 0.5;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + fade);
    source.connect(gain).connect(musicBus);
    source.start(now, start);
    fadeOut(current, fade);
    current = { name, source, gain };
  }

  // A one-shot cue over the music (the gates opening). The music ducks under
  // it, then `after` takes over as the cue ends.
  async function playCue(name, after) {
    const buffer = await loadBuffer(ctx, name);
    if (!alive || !buffer) return;
    if (cue) fadeOut(cue, 0.3);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.85;
    source.connect(gain).connect(musicBus);
    const now = ctx.currentTime;
    source.start(now, leadingSilence(buffer));
    cue = { name, source, gain };
    if (current) fadeOut(current, 0.8);
    current = null;
    // The cue's last seconds are its tail: bring the next music in under it.
    const lead = Math.max(1, buffer.duration - 3.5);
    const timer = setTimeout(() => {
      if (alive && cue && cue.source === source && !current) playMusic(after || worldName, 2.5);
    }, lead * 1000);
    source.onended = () => {
      clearTimeout(timer);
      if (cue && cue.source === source) cue = null;
    };
  }

  // ---- Effects ----

  async function play(name, volume = 0.5, { rate = 1, pan = 0 } = {}) {
    const buffer = await loadBuffer(ctx, name);
    if (!alive || !buffer || ctx.state !== 'running') return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    let node = source.connect(gain);
    if (pan && ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      node = node.connect(panner);
    }
    node.connect(sfxBus);
    source.start();
  }

  let nextStep = 0;
  let lastStep = -1;
  function footsteps(time, moving, running) {
    if (!moving || time < nextStep) return;
    nextStep = time + (running ? 240 : 360) + Math.random() * 30;
    let index = Math.floor(Math.random() * STEPS.length);
    if (index === lastStep) index = (index + 1) % STEPS.length;
    lastStep = index;
    // Left foot, right foot: a little pan and pitch each time.
    const side = index % 2 ? 0.12 : -0.12;
    play(STEPS[index], (running ? 0.55 : 0.42) * (0.85 + Math.random() * 0.3), {
      rate: 0.9 + Math.random() * 0.2,
      pan: side,
    });
  }

  // ---- Story beats ----

  function doorOpen() {
    if (!troy) {
      play('door-hall', 0.75);
      return;
    }
    if (place === 'horse') {
      play('door-hatch', 0.7);
      return;
    }
    // The gates of Troy: the war begins.
    worldName = 'music-troy-war';
    playCue('cue-war', 'music-troy-war');
  }

  function fightStart() {
    if (cue) fadeOut(cue, 0.6);
    cue = null;
    playMusic('music-combat', 0.6);
  }

  function fightEnd() {
    playMusic(worldName, 2.0);
  }

  function fightBlow({ damage, heavy, splash, blocked } = {}) {
    play('attack-swing', 0.4, { rate: 0.95 + Math.random() * 0.1 });
    if (blocked) play('hit-block', 0.5);
    else if (damage > 0) play(heavy || splash ? 'hit-heavy' : 'hit-light', 0.55);
  }

  function onPlace(next) {
    place = next;
  }

  const events = {
    audioStep: footsteps,
    audioDoorOpen: doorOpen,
    audioCombatStart: fightStart,
    audioCombatEnd: fightEnd,
    fightBlow,
    audioBlow: fightBlow,
    gameOver: fightEnd,
    audioSelect: () => play('ui-select', 0.3),
    audioTransition: () => play('world-transition', 0.35),
    ...(troy ? {
      place: onPlace,
      interact: () => play('interact', 0.35),
      hatchQuestion: () => play('interact', 0.35),
      gateQuestion: () => play('interact', 0.35),
      gatePick: () => play('ui-select', 0.3),
      fightAttack: () => play('ui-select', 0.3),
      fightStart,
      fightEnd,
    } : {
      talk: () => play('interact', 0.35),
      hallDoor: () => play('interact', 0.35),
      bowFound: () => play('pickup', 0.5),
    }),
  };
  for (const [name, handler] of Object.entries(events)) game.events.on(name, handler);

  // Browsers only allow sound after the player does something.
  function wake() {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!current && !cue) playMusic(wanted);
  }
  window.addEventListener('keydown', wake);
  window.addEventListener('pointerdown', wake);
  wake();

  game.events.once('destroy', () => {
    alive = false;
    window.removeEventListener('keydown', wake);
    window.removeEventListener('pointerdown', wake);
    for (const [name, handler] of Object.entries(events)) game.events.off(name, handler);
    fadeOut(current, 0.4);
    fadeOut(cue, 0.4);
    current = null;
    cue = null;
    setTimeout(() => {
      out.disconnect();
    }, 600);
  });
}
