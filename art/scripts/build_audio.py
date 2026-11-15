#!/usr/bin/env python3
"""Compose and render the game's music and sounds (no samples, all synthesis).

The sound of the Odyssey, as far as code can get it: Greek modes, a plucked
lyre (kithara), the reedy aulos, frame drums, big war drums, bronze horns
(salpinx), a low choir, wind and sea, and the din of battle.

  public/assets/audio/music-troy-night.mp3   inside the horse, Troy asleep
  public/assets/audio/music-troy-war.mp3     the city after the gates open
  public/assets/audio/music-combat.mp3       a fight
  public/assets/audio/music-ithaca.mp3       home, at night
  public/assets/audio/cue-war.mp3            the gates open: war begins
  public/assets/audio/step-1..4.wav          sandals on stone
  public/assets/audio/door-hatch.mp3         the horse's hatch
  public/assets/audio/door-hall.mp3          the palace doors
  src/game/audioManifest.json                loop lengths, for gapless loops

Music loops are circular: everything that rings past the end is wrapped to
the start, and the file carries one extra second, so the player can loop
sample-accurately between loopStart and loopStart + loop seconds.

Run from the repo root (needs numpy, scipy and ffmpeg):

  python3 art/scripts/build_audio.py
"""

from __future__ import annotations

import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "audio"
MANIFEST = ROOT / "src" / "game" / "audioManifest.json"
SR = 44100

rng = np.random.default_rng(800)  # around when the Odyssey was sung


# ---- Basics ------------------------------------------------------------------

def secs(n: float) -> int:
    return int(round(n * SR))


def tvec(dur: float) -> np.ndarray:
    return np.arange(secs(dur)) / SR


def midi(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def sos(kind: str, freq, order: int = 2):
    return signal.butter(order, freq, btype=kind, fs=SR, output="sos")


def filt(x: np.ndarray, kind: str, freq, order: int = 2) -> np.ndarray:
    return signal.sosfilt(sos(kind, freq, order), x, axis=-1)


def env(n: int, attack: float, release: float, hold: float | None = None) -> np.ndarray:
    """Linear attack, then exponential-ish release to the end."""
    e = np.ones(n)
    a = min(n, secs(attack))
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.5
    r = min(n - a, secs(release))
    if r > 0:
        e[n - r:] *= np.linspace(1, 0, r) ** 2
    return e


def stereo(mono: np.ndarray, pan: float = 0.0) -> np.ndarray:
    """Constant-power pan, -1 left .. 1 right."""
    a = (pan + 1) * np.pi / 4
    return np.vstack([mono * np.cos(a), mono * np.sin(a)])


class Track:
    """A stereo buffer with room for a tail; notes are placed in seconds."""

    def __init__(self, length: float, tail: float = 6.0):
        self.length = length
        self.tail = tail
        self.buf = np.zeros((2, secs(length + tail)))

    def add(self, sound: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0):
        if sound.ndim == 1:
            sound = stereo(sound, pan)
        start = secs(at)
        if start >= self.buf.shape[1]:
            return
        end = min(self.buf.shape[1], start + sound.shape[1])
        self.buf[:, start:end] += sound[:, : end - start] * gain


def reverb_ir(rt60: float = 2.4, predelay: float = 0.025, bright: float = 5000) -> np.ndarray:
    """A hall: decorrelated noise in each ear, darker as it decays."""
    n = secs(rt60 * 1.1)
    t = np.arange(n) / SR
    ir = np.zeros((2, n + secs(predelay)))
    for ch in range(2):
        noise = rng.standard_normal(n)
        bright_part = filt(noise, "lowpass", bright) * np.exp(-t * 6.9 / (rt60 * 0.55))
        dark_part = filt(noise, "lowpass", 1400) * np.exp(-t * 6.9 / rt60)
        ir[ch, secs(predelay):] = bright_part * 0.6 + dark_part
    # A few early reflections off stone walls.
    for d, g in ((0.011, 0.5), (0.019, 0.35), (0.031, 0.28), (0.047, 0.2)):
        ir[0, secs(d)] += g
        ir[1, secs(d * 1.13)] += g
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def apply_reverb(x: np.ndarray, ir: np.ndarray, wet: float) -> np.ndarray:
    out = np.vstack([signal.fftconvolve(x[ch], ir[ch])[: x.shape[1]] for ch in range(2)])
    return x * (1 - wet * 0.5) + out * wet


def master(x: np.ndarray, rms_db: float, ceiling: float = 0.84) -> np.ndarray:
    """Set the loudness, then a soft limiter so peaks stay under the ceiling."""
    x = x - np.mean(x, axis=1, keepdims=True)
    rms = np.sqrt(np.mean(x ** 2))
    x = x * (10 ** (rms_db / 20) / max(rms, 1e-9))
    k = 1.6
    x = np.tanh(x * k) / np.tanh(k)
    peak = np.max(np.abs(x))
    if peak > ceiling:
        x *= ceiling / peak
    return x


# ---- Instruments ---------------------------------------------------------------

def lyre(freq: float, dur: float = 3.0, bright: float = 1.0) -> np.ndarray:
    """A plucked kithara string: decaying harmonics, a touch of inharmonicity,
    a pluck of noise, and a wooden body."""
    t = tvec(dur)
    out = np.zeros_like(t)
    pos = 0.17
    for k in range(1, 16):
        fk = freq * k * np.sqrt(1 + 0.00025 * k * k)
        if fk > 12000:
            break
        amp = abs(np.sin(np.pi * k * pos)) / k ** (1.25 - 0.25 * bright)
        tau = 2.4 / (1 + 0.45 * (k - 1))
        out += amp * np.exp(-t / tau) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    pluck = filt(rng.standard_normal(secs(0.012)), "bandpass", [1800, 6000]) * 0.25
    out[: pluck.size] += pluck * np.linspace(1, 0, pluck.size)
    body = filt(out, "bandpass", [180, 420]) * 0.5 + filt(out, "bandpass", [900, 1600]) * 0.25
    out = out + body
    out[: secs(0.003)] *= np.linspace(0, 1, secs(0.003))
    return out / np.max(np.abs(out))


def aulos(freq: float, dur: float, vibrato: float = 0.006, breath: float = 0.05) -> np.ndarray:
    """The aulos: a double-reed pipe, nasal and bright, with a slow vibrato."""
    t = tvec(dur)
    vib_amt = vibrato * np.clip((t - 0.25) / 0.4, 0, 1)
    f = freq * (1 + vib_amt * np.sin(2 * np.pi * 5.3 * t)) * (1 - 0.02 * np.exp(-t / 0.04))
    phase = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros_like(t)
    for k in range(1, 30):
        if freq * k > 11000:
            break
        formant = 1 + 2.4 * np.exp(-(((freq * k) - 1350) / 550) ** 2) + 1.2 * np.exp(-(((freq * k) - 2900) / 700) ** 2)
        out += (formant / k ** 0.85) * np.sin(k * phase)
    noise = filt(rng.standard_normal(t.size), "bandpass", [1800, 5500]) * breath
    out = out / np.max(np.abs(out)) + noise
    return out * env(t.size, 0.07, min(0.25, dur * 0.4))


def choir(notes: list[int], dur: float, vowel: str = "ah", attack: float = 1.4, release: float = 2.2) -> np.ndarray:
    """A low male choir: detuned voices through vowel formants."""
    t = tvec(dur)
    formants = {"ah": [(750, 1.0), (1150, 0.6), (2800, 0.25)], "oh": [(500, 1.0), (850, 0.6), (2600, 0.15)]}[vowel]
    out = np.zeros_like(t)
    for note in notes:
        for detune in (-7, -2, 3, 8):
            f0 = midi(note) * 2 ** (detune / 1200)
            vib = 1 + 0.004 * np.sin(2 * np.pi * rng.uniform(4.5, 5.8) * t + rng.uniform(0, 6))
            phase = np.cumsum(f0 * vib) / SR
            saw = 2 * (phase % 1) - 1
            out += saw
    voiced = np.zeros_like(out)
    for fc, g in formants:
        voiced += filt(out, "bandpass", [fc * 0.8, fc * 1.2]) * g
    voiced = filt(voiced, "lowpass", 4000)
    voiced /= np.max(np.abs(voiced)) + 1e-9
    return voiced * env(t.size, attack, release)


def drone(note: int, dur: float, cutoff: float = 500) -> np.ndarray:
    t = tvec(dur)
    out = np.zeros_like(t)
    for detune in (-4, 0, 5):
        phase = np.cumsum(np.full(t.size, midi(note) * 2 ** (detune / 1200))) / SR
        out += 2 * (phase % 1) - 1
    out = filt(out, "lowpass", cutoff, 2)
    out *= 1 + 0.15 * np.sin(2 * np.pi * 0.11 * t)
    return out / np.max(np.abs(out))


def frame_drum(pitch: float = 95, dur: float = 0.6, slap: bool = False) -> np.ndarray:
    """A tympanon frame drum: a boomy skin, or a sharp slap at the rim."""
    t = tvec(dur)
    if slap:
        body = np.sin(2 * np.pi * 240 * t * (1 + 0.4 * np.exp(-t / 0.01))) * np.exp(-t / 0.05)
        skin = filt(rng.standard_normal(t.size), "bandpass", [1400, 6000]) * np.exp(-t / 0.035)
        out = body * 0.5 + skin * 0.9
    else:
        f = pitch * (1 + 1.2 * np.exp(-t / 0.018))
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
        skin = filt(rng.standard_normal(t.size), "bandpass", [180, 1300]) * np.exp(-t / 0.06)
        out = body + skin * 0.45
    out[: secs(0.002)] *= np.linspace(0, 1, secs(0.002))
    return out / np.max(np.abs(out))


def war_drum(pitch: float = 52, dur: float = 1.8) -> np.ndarray:
    """A huge war drum: a deep boom that drops in pitch, and a slap of hide."""
    t = tvec(dur)
    f = pitch * (1 + 1.4 * np.exp(-t / 0.03))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    sub = np.sin(2 * np.pi * pitch * 0.5 * t) * np.exp(-t / 0.7) * 0.4
    hide = filt(rng.standard_normal(t.size), "lowpass", 900) * np.exp(-t / 0.08)
    crack = filt(rng.standard_normal(t.size), "bandpass", [800, 3500]) * np.exp(-t / 0.015)
    out = body + sub + hide * 0.6 + crack * 0.35
    out = np.tanh(out * 1.4)
    return out / np.max(np.abs(out))


def horn(freq: float, dur: float, voices: int = 3, bright: float = 1.0) -> np.ndarray:
    """A bronze war horn (salpinx): a blatty scoop up into a bright, buzzing tone."""
    t = tvec(dur)
    b = np.clip(t / 0.18, 0, 1) ** 0.7 * (0.78 + 0.22 * np.exp(-t / 0.4)) * bright
    out = np.zeros_like(t)
    for v in range(voices):
        det = (v - (voices - 1) / 2) * 6
        scoop = 1 - 0.045 * np.exp(-t / 0.07)
        vib = 1 + 0.0045 * np.sin(2 * np.pi * 5.0 * t + v) * np.clip((t - 0.4) / 0.5, 0, 1)
        f = freq * 2 ** (det / 1200) * scoop * vib
        phase = 2 * np.pi * np.cumsum(f) / SR
        for k in range(1, 22):
            if freq * k > 9000:
                break
            out += (b ** (0.35 * (k - 1))) / k ** 0.75 * np.sin(k * phase)
    out = filt(out, "lowpass", 6500)
    out = np.tanh(out / np.max(np.abs(out)) * 1.8)
    return out * env(t.size, 0.02, min(0.6, dur * 0.35))


def metal_clash(base: float | None = None) -> np.ndarray:
    """Bronze on bronze: inharmonic ringing partials and a sharp click."""
    base = base or rng.uniform(900, 2300)
    dur = rng.uniform(0.35, 0.8)
    t = tvec(dur)
    out = np.zeros_like(t)
    for ratio, amp, tau in ((1, 1, 0.25), (1.58, 0.7, 0.18), (2.23, 0.55, 0.14), (2.92, 0.45, 0.1), (3.61, 0.35, 0.09), (4.43, 0.25, 0.07), (5.6, 0.2, 0.05)):
        out += amp * np.exp(-t / (tau * rng.uniform(0.7, 1.4))) * np.sin(2 * np.pi * base * ratio * t + rng.uniform(0, 6))
    click = filt(rng.standard_normal(t.size), "highpass", 2500) * np.exp(-t / 0.006)
    out = out / np.max(np.abs(out)) + click * 0.8
    return out / np.max(np.abs(out))


def shout(dur: float | None = None) -> np.ndarray:
    """One warrior's cry in the distance: a voiced 'ah' that rises and falls."""
    dur = dur or rng.uniform(0.5, 1.3)
    t = tvec(dur)
    f0 = rng.uniform(110, 210)
    glide = 1 + rng.uniform(0.15, 0.45) * np.sin(np.pi * t / dur) - rng.uniform(0, 0.15) * t / dur
    phase = np.cumsum(f0 * glide * (1 + 0.02 * rng.standard_normal(t.size).cumsum() / np.sqrt(np.arange(1, t.size + 1)))) / SR
    src = 2 * (phase % 1) - 1 + 0.25 * rng.standard_normal(t.size)
    v = rng.uniform(0.85, 1.15)
    out = filt(src, "bandpass", [600 * v, 950 * v]) + 0.6 * filt(src, "bandpass", [1050 * v, 1400 * v]) + 0.2 * filt(src, "bandpass", [2400, 3200])
    out *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return out / (np.max(np.abs(out)) + 1e-9)


def crowd(dur: float, density: float = 30, roar: float = 1.0) -> np.ndarray:
    """An army: a roar of many voices, and single cries rising out of it."""
    t = tvec(dur)
    out = np.zeros((2, t.size))
    for _ in range(6):
        lo = rng.uniform(250, 500)
        layer = filt(rng.standard_normal(t.size), "bandpass", [lo, lo * rng.uniform(3, 5)])
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.2, 1.4) * t + rng.uniform(0, 6))
        out += stereo(layer * lfo * roar * 0.35, rng.uniform(-0.8, 0.8))
    for _ in range(int(density * dur)):
        s = shout()
        at = secs(rng.uniform(0, max(0.01, dur - 0.5)))
        end = min(t.size, at + s.size)
        out[:, at:end] += stereo(s[: end - at] * rng.uniform(0.25, 0.7), rng.uniform(-0.9, 0.9))
    return out


def wind(dur: float, level: float = 1.0) -> np.ndarray:
    t = tvec(dur)
    out = np.zeros((2, t.size))
    for ch in range(2):
        n = rng.standard_normal(t.size)
        gust = 0.55 + 0.45 * np.sin(2 * np.pi * 0.07 * t + ch) * np.sin(2 * np.pi * 0.023 * t + 1)
        out[ch] = filt(n, "bandpass", [220, 1400]) * gust * level
    return out


def sea(dur: float, period: float = 7.0) -> np.ndarray:
    """Waves on the shore: noise that swells and draws back."""
    t = tvec(dur)
    out = np.zeros((2, t.size))
    for ch in range(2):
        n = rng.standard_normal(t.size)
        phase = (t / period + ch * 0.37) % 1
        swell = np.where(phase < 0.35, (phase / 0.35) ** 2, np.exp(-(phase - 0.35) * 5))
        out[ch] = filt(n, "lowpass", 900) * (0.25 + swell) + filt(n, "highpass", 3000) * swell * 0.25
    return out


# ---- Music -------------------------------------------------------------------

def render_loop(track: Track, ir, wet: float, rms_db: float) -> np.ndarray:
    """Reverb, wrap the tail to the start (a seamless circle), master."""
    x = apply_reverb(track.buf, ir, wet)
    n = secs(track.length)
    tail = x.shape[1] - n
    x[:, :tail] += x[:, n:]
    x = x[:, :n]
    return master(x, rms_db)


def beat_time(bpm: float):
    spb = 60 / bpm
    return lambda bar, beat=0.0: (bar * 4 + beat) * spb


# E Phrygian, Troy at night: E F G A B C D.
E2, B2, E3, F3, G3, A3, B3, C4, D4, E4, F4, G4, A4, B4 = 40, 47, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71


def troy_night() -> tuple[np.ndarray, float]:
    """Stealth: a low drone, a lyre picking out the mode, a heartbeat on the
    frame drum, wind over the walls, and a lone aulos."""
    bpm, bars = 72, 20
    at = beat_time(bpm)
    length = at(bars)
    tr = Track(length)
    tr.add(stereo(drone(E2, length + 4, 380), 0) * 0.32, 0)
    tr.add(stereo(drone(B2, length + 4, 420), 0) * 0.16, 0)
    tr.add(wind(length + 4, 0.18), 0)
    chords = [[E3, B3], [F3, C4], [E3, B3], [D4 - 12, A3]]
    for bar in range(0, bars, 2):
        notes = chords[(bar // 2) % len(chords)]
        tr.add(stereo(choir(notes, at(2) + 1.5, "oh", 1.6, 1.8), 0) * 0.16, at(bar))
    pattern = [E3, B3, E4, B3, G3, B3, F4, B3]
    for bar in range(bars):
        if bar % 4 == 3:
            continue
        for i, note in enumerate(pattern if bar % 2 == 0 else [E3, A3, C4, A3, F3, A3, E4, A3]):
            if bar < 2 and i % 2:
                continue
            tr.add(lyre(midi(note), 3.0) * 0.17, at(bar, i * 0.5), pan=-0.25 + 0.5 * (i % 2))
    for bar in range(bars):
        tr.add(frame_drum(78, 0.7) * 0.32, at(bar, 0), pan=0.1)
        tr.add(frame_drum(78, 0.7) * 0.2, at(bar, 0.75), pan=0.1)
    melody = [(8, 0, E4, 1.5), (8, 1.5, F4, 0.5), (8, 2, G4, 2), (9, 0, F4, 1), (9, 1, E4, 3),
              (10, 0, D4, 1.5), (10, 1.5, E4, 0.5), (10, 2, F4, 1.5), (10, 3.5, E4, 0.5), (11, 0, E4, 4),
              (14, 0, B4, 1), (14, 1, A4, 1), (14, 2, G4, 2), (15, 0, F4, 1.5), (15, 1.5, G4, 0.5), (15, 2, E4, 2),
              (16, 0, F4, 2), (16, 2, E4, 2), (17, 0, E4, 4)]
    for bar, beat, note, beats in melody:
        tr.add(aulos(midi(note), beats * 60 / bpm + 0.2, 0.007, 0.04) * 0.15, at(bar, beat), pan=0.2)
    return render_loop(tr, reverb_ir(2.8), 0.55, -21), length


def troy_war() -> tuple[np.ndarray, float]:
    """The city is at war: war drums pound, the choir swells, horns call, and
    the battle rages somewhere close."""
    bpm, bars = 96, 16
    at = beat_time(bpm)
    length = at(bars)
    tr = Track(length)
    tr.add(stereo(drone(E2, length + 4, 450), 0) * 0.35, 0)
    tr.add(crowd(length + 2, density=10, roar=0.55) * 0.13, 0)
    for _ in range(int(length * 1.2)):
        tr.add(metal_clash() * rng.uniform(0.03, 0.08), rng.uniform(0, length), pan=rng.uniform(-0.9, 0.9))
    chords = [[E3, B3, E4], [F3, C4, F4], [E3, B3, G4], [D4 - 12, A3, D4]]
    for bar in range(0, bars, 2):
        tr.add(stereo(choir(chords[(bar // 2) % 4], at(2) + 1.2, "ah", 0.9, 1.4), 0) * 0.24, at(bar))
    for bar in range(bars):
        for beat, gain in ((0, 0.9), (1.5, 0.55), (2, 0.75), (3, 0.5), (3.5, 0.6)):
            tr.add(war_drum(50 if beat == 0 else 58, 1.5) * gain * 0.55, at(bar, beat), pan=0.0)
        for i in range(8):
            tr.add(frame_drum(110, 0.4, slap=(i % 2 == 1)) * (0.22 if i % 2 else 0.3), at(bar, i * 0.5), pan=0.35)
    for bar in (3, 11):
        tr.add(horn(midi(E3), 1.8) * 0.3, at(bar, 2), pan=-0.3)
        tr.add(horn(midi(B3), 1.8) * 0.22, at(bar, 2), pan=0.3)
    riff = [E3, F3, E3, G3, F3, E3, D4 - 12, E3]
    for bar in range(4, bars):
        for i, note in enumerate(riff):
            tr.add(lyre(midi(note), 1.4, 1.4) * 0.16, at(bar, i * 0.5), pan=-0.2)
    return render_loop(tr, reverb_ir(2.4), 0.45, -19), length


# D Phrygian dominant for the fights: D Eb F# G A Bb C.
D2, A2, D3, Eb3, Fs3, G3d, A3d, Bb3, C4d, D4d, Eb4, Fs4, G4d, A4d = 38, 45, 50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69


def combat() -> tuple[np.ndarray, float]:
    """A fight: a driving drum ostinato, an aulos riff in Phrygian dominant,
    horn stabs and a choir that lifts at the turn."""
    bpm, bars = 138, 24
    at = beat_time(bpm)
    length = at(bars)
    tr = Track(length)
    tr.add(stereo(drone(D2, length + 4, 520), 0) * 0.33, 0)
    tr.add(stereo(drone(A2, length + 4, 520), 0) * 0.15, 0)
    for bar in range(bars):
        for beat in (0, 1, 2, 3):
            tr.add(war_drum(48 if beat in (0, 2) else 56, 1.0) * (0.75 if beat == 0 else 0.5), at(bar, beat))
        for i in range(16):
            accent = i % 4 == 0
            slap = i % 4 == 2
            tr.add(frame_drum(130, 0.25, slap=slap) * (0.32 if accent else 0.18), at(bar, i * 0.25), pan=0.4 if i % 2 else 0.25)
        if bar % 4 == 3:
            for i in range(8):
                tr.add(war_drum(70 + i * 6, 0.6) * (0.25 + i * 0.05), at(bar, 2 + i * 0.25), pan=-0.3 + i * 0.08)
    riff = [D3, Eb3, Fs3, Eb3, D3, A2 + 12, G3d, Fs3]
    for bar in range(bars):
        shift = 0 if (bar // 4) % 2 == 0 else 5
        for i, note in enumerate(riff):
            tr.add(lyre(midi(note + shift), 0.9, 1.6) * 0.2, at(bar, i * 0.5), pan=-0.35)
    phrase = [(0, D4d, 1.5), (1.5, Eb4, 0.5), (2, Fs4, 1), (3, G4d, 1), (4, A4d, 2), (6, G4d, 1), (7, Fs4, 1),
              (8, Eb4, 1.5), (9.5, Fs4, 0.5), (10, Eb4, 1), (11, D4d, 1), (12, D4d, 4)]
    for start in (8, 16):
        for beat, note, beats in phrase:
            tr.add(aulos(midi(note), beats * 60 / bpm + 0.1, 0.008, 0.05) * 0.2, at(start) + beat * 60 / bpm, pan=0.25)
    for bar in range(0, bars, 4):
        tr.add(horn(midi(D3), 0.5) * 0.28, at(bar, 0), pan=-0.2)
        tr.add(horn(midi(A3d), 0.5) * 0.22, at(bar, 0), pan=0.2)
        tr.add(horn(midi(D3), 0.35) * 0.22, at(bar, 2.5))
        tr.add(horn(midi(Eb3), 0.9) * 0.24, at(bar, 3))
    chords = [[D3, A3d, D4d], [Eb3, Bb3, Eb4], [D3, Fs3, A3d], [C4d - 12, G3d, C4d]]
    for i, bar in enumerate(range(8, bars, 4)):
        tr.add(stereo(choir(chords[i % 4], at(4) + 1, "ah", 0.6, 1.2), 0) * 0.22, at(bar))
    return render_loop(tr, reverb_ir(2.0), 0.35, -17.5), length


# D Dorian for home: D E F G A B C.
D3h, E3h, F3h, G3h, A3h, B3h, C4h, D4h, E4h, F4h, G4h, A4h = 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69


def ithaca() -> tuple[np.ndarray, float]:
    """Home: the sea on the shore, a warm lyre in D Dorian, a soft aulos
    singing of the long way back."""
    bpm, bars = 66, 20
    at = beat_time(bpm)
    length = at(bars)
    tr = Track(length)
    tr.add(stereo(drone(38, length + 4, 360), 0) * 0.25, 0)
    tr.add(sea(length + 4, 7.3) * 0.12, 0)
    progression = [[D3h, A3h, D4h, F4h], [C4h - 12, G3h, C4h, E4h], [B3h - 12, F3h, B3h, D4h], [A3h - 12, E3h, A3h, C4h]]
    for bar in range(bars):
        chord = progression[bar % 4]
        arp = [chord[0], chord[1], chord[2], chord[3], chord[2], chord[1]]
        for i, note in enumerate(arp):
            tr.add(lyre(midi(note), 3.5, 0.8) * 0.17, at(bar, i * 4 / 6), pan=-0.3 + 0.12 * i)
        if bar % 2 == 0:
            tr.add(stereo(choir([chord[0], chord[2]], at(2) + 1.5, "oh", 1.8, 2.0), 0) * 0.1, at(bar))
    melody = [(4, 0, A4h, 2), (4, 2, G4h, 1), (4, 3, F4h, 1), (5, 0, E4h, 3), (5, 3, D4h, 1),
              (6, 0, F4h, 2), (6, 2, E4h, 2), (7, 0, D4h, 4),
              (12, 0, D4h, 1), (12, 1, E4h, 1), (12, 2, F4h, 2), (13, 0, G4h, 2), (13, 2, A4h, 2),
              (14, 0, C4h + 12, 2), (14, 2, B3h + 12, 1), (14, 3, A4h, 1), (15, 0, A4h, 4)]
    for bar, beat, note, beats in melody:
        tr.add(aulos(midi(note), beats * 60 / bpm + 0.3, 0.006, 0.035) * 0.11, at(bar, beat), pan=0.2)
    return render_loop(tr, reverb_ir(3.0), 0.5, -21.5), length


def war_cue() -> np.ndarray:
    """The gates of Troy open, and the war begins. About twelve seconds:
    a rumble swells, war horns blast, the drums gather into a roll, the army
    roars, bronze clashes, the horns call again, and the choir rises."""
    length = 12.5
    tr = Track(length, tail=4)
    t = tvec(4)
    rumble = filt(rng.standard_normal(t.size), "lowpass", 140) * np.linspace(0, 1, t.size) ** 2
    tr.add(stereo(rumble, 0) * 0.9, 0)
    tr.add(stereo(drone(E2, length, 300), 0) * np.concatenate([np.linspace(0, 0.45, secs(3)), np.full(secs(length) - secs(3), 0.45)]), 0)
    # The first blast: two horns, root and fifth, then a third horn an octave up.
    for f, g, p in ((E3, 0.55, -0.3), (B3, 0.42, 0.3), (E2 + 12, 0.35, 0)):
        tr.add(horn(midi(f), 2.6) * g, 0.8, pan=p)
    tr.add(horn(midi(E4), 1.8) * 0.3, 1.6, pan=0.1)
    # Drums gather: hits closer and closer together, then the slam.
    hits = []
    tt = 2.6
    gap = 0.5
    while tt < 5.6:
        hits.append(tt)
        tt += gap
        gap = max(0.09, gap * 0.82)
    for i, h in enumerate(hits):
        tr.add(war_drum(56 + (i % 3) * 4, 1.2) * (0.35 + 0.5 * i / len(hits)), h, pan=rng.uniform(-0.4, 0.4))
    for h in (5.7, 5.72):
        tr.add(war_drum(44, 2.4), h, gain=1.0)
    # The armies meet: a roar and bronze on bronze.
    roar = crowd(6.8, density=45, roar=1.3)
    swell = np.concatenate([np.linspace(0.2, 1, secs(1.0)), np.ones(roar.shape[1] - secs(1.0))])
    roar *= swell * np.concatenate([np.ones(roar.shape[1] - secs(2.0)), np.linspace(1, 0.3, secs(2.0))])
    tr.add(roar * 0.5, 5.5)
    for _ in range(38):
        tr.add(metal_clash() * rng.uniform(0.12, 0.3), rng.uniform(5.8, 11.5), pan=rng.uniform(-0.9, 0.9))
    for bar_t in np.arange(5.7, 11.6, 60 / 100):
        tr.add(war_drum(50, 1.4) * 0.55, bar_t)
        tr.add(frame_drum(115, 0.4, slap=True) * 0.25, bar_t + 0.3, pan=0.4)
    # The horns call again over the fighting, and the choir lifts.
    for f, g, p in ((E3, 0.45, -0.25), (B3, 0.36, 0.25), (E4, 0.28, 0)):
        tr.add(horn(midi(f), 2.2) * g, 7.6, pan=p)
    tr.add(stereo(choir([E3, B3, E4, G4], 5.5, "ah", 0.8, 2.5), 0) * 0.4, 6.5)
    x = apply_reverb(tr.buf, reverb_ir(2.6), 0.42)
    x = x[:, : secs(length + 3.5)]
    fade = np.linspace(1, 0, secs(2.5)) ** 2
    x[:, -fade.size:] *= fade
    return master(x, -14.5)


# ---- Sounds ---------------------------------------------------------------------

def footstep(seed: int) -> np.ndarray:
    """A leather sandal on stone and grit: a soft heel thud, then the scuff."""
    r = np.random.default_rng(seed)
    dur = 0.24
    t = tvec(dur)
    heel = np.sin(2 * np.pi * r.uniform(70, 95) * t * (1 + 0.6 * np.exp(-t / 0.01))) * np.exp(-t / 0.028)
    grit = filt(r.standard_normal(t.size), "bandpass", [r.uniform(900, 1400), r.uniform(3500, 5000)])
    scuff_env = np.exp(-np.maximum(t - 0.012, 0) / r.uniform(0.03, 0.05)) * (t > 0.008)
    # Little crackles of grit under the sole.
    for _ in range(r.integers(3, 7)):
        c = int(r.uniform(0.01, 0.09) * SR)
        scuff_env[c: c + 60] += r.uniform(0.3, 0.8)
    out = heel * 0.9 + grit * scuff_env * 0.42
    out = filt(out, "lowpass", 6500)
    out[: secs(0.002)] *= np.linspace(0, 1, secs(0.002))
    return out / np.max(np.abs(out)) * 0.9


def creak(dur: float, low: float, high: float, res: list[float], seed: int, thud: bool) -> np.ndarray:
    """Wood on wood: a stick-slip pulse train through the resonances of a
    plank, then the door comes to rest."""
    r = np.random.default_rng(seed)
    t = tvec(dur)
    rate = low + (high - low) * (0.5 + 0.5 * np.sin(2 * np.pi * t / dur * r.uniform(0.8, 1.5) + r.uniform(0, 3)))
    rate *= 1 + 0.15 * filt(r.standard_normal(t.size), "lowpass", 6) * 8
    phase = np.cumsum(np.clip(rate, 20, None)) / SR
    pulses = np.diff(np.floor(phase), prepend=0) > 0
    excite = pulses.astype(float) * (0.6 + 0.4 * r.random(t.size))
    out = np.zeros_like(t)
    for f in res:
        b, a = signal.iirpeak(f, 18, fs=SR)
        out += signal.lfilter(b, a, excite)
    shape = np.sin(np.pi * np.clip(t / (dur * 0.85), 0, 1)) ** 0.5
    out *= shape
    out /= np.max(np.abs(out)) + 1e-9
    if thud:
        tt = tvec(0.6)
        boom = np.sin(2 * np.pi * 65 * tt * (1 + 0.5 * np.exp(-tt / 0.02))) * np.exp(-tt / 0.12)
        boom += filt(r.standard_normal(tt.size), "lowpass", 600) * np.exp(-tt / 0.05) * 0.5
        out = np.concatenate([out, np.zeros(secs(0.6))])
        out[secs(dur * 0.85): secs(dur * 0.85) + boom.size] += boom * 1.1
    return out / np.max(np.abs(out)) * 0.9


def sound_reverb(x: np.ndarray, rt: float, wet: float) -> np.ndarray:
    st = stereo(x, 0)
    st = np.concatenate([st, np.zeros((2, secs(rt)))], axis=1)
    return apply_reverb(st, reverb_ir(rt, 0.01), wet)


# ---- Output ---------------------------------------------------------------------

def write_wav(path: Path, x: np.ndarray, sr: int = SR) -> None:
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = x[None, :]
    data = (x.T * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(x.shape[0])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())


def write_mp3(path: Path, x: np.ndarray, kbps: int = 160) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "x.wav"
        write_wav(wav, x)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", str(path)], check=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    loops = {}
    for name, make in (("music-troy-night", troy_night), ("music-troy-war", troy_war), ("music-combat", combat), ("music-ithaca", ithaca)):
        x, length = make()
        # One extra second past the loop, so the player can loop gaplessly.
        padded = np.concatenate([x, x[:, : secs(1.0)]], axis=1)
        write_mp3(OUT / f"{name}.mp3", padded)
        loops[name] = round(secs(length) / SR, 6)
        print(f"{name}: {length:.2f} s loop")
    write_mp3(OUT / "cue-war.mp3", war_cue(), 192)
    print("cue-war")
    for i in range(4):
        step = sound_reverb(footstep(11 + i), 0.3, 0.12)
        write_wav(OUT / f"step-{i + 1}.wav", np.mean(step, axis=0)[None, :] * 1.0)
    hatch = sound_reverb(creak(1.0, 50, 150, [620, 1240, 1950], 5, True), 0.9, 0.25)
    write_mp3(OUT / "door-hatch.mp3", master(hatch, -16), 128)
    hall = sound_reverb(creak(1.8, 30, 95, [310, 680, 1100], 9, True), 2.2, 0.35)
    write_mp3(OUT / "door-hall.mp3", master(hall, -16), 128)
    print("steps and doors")
    MANIFEST.write_text(json.dumps({"loops": loops}, indent=2) + "\n")
    print("Wrote", MANIFEST.relative_to(ROOT))


if __name__ == "__main__":
    main()
