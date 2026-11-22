"""Tema original "Four" para la página de Four Makeup.
Chill pop / ambiental, 100 BPM, 16 compases que se repiten sin corte.
Pad suave, piano eléctrico, bajo, batería liviana y una melodía de pluck.
Uso: python3 four_music.py salida.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 16
LOOP = BARS * BAR
N = int(LOOP * SR)
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    sus = max(n - a - d - r, 0)
    e = np.concatenate([
        np.linspace(0, 1, max(a, 1)),
        np.linspace(1, s, max(d, 1)),
        np.full(sus, s),
        np.linspace(s, 0, max(r, 1)),
    ])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def place(buf, sig, t):
    """Suma sig en buf desde el tiempo t, dando la vuelta al final (loop perfecto)."""
    i = int(t * SR) % N
    end = i + len(sig)
    if end <= N:
        buf[i:end] += sig
    else:
        cut = N - i
        buf[i:] += sig[:cut]
        rest = sig[cut:]
        while len(rest):
            k = min(len(rest), N)
            buf[:k] += rest[:k]
            rest = rest[k:]


# Progresión: Fmaj7 · Em7 · Dm7 · Cmaj7 (dos veces) y Am7 · Fmaj7 · Cmaj7 · G6 (dos veces)
A = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
B = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 64]]
chords = A + A + B + B
roots = [c[0] - 12 for c in chords]

L = np.zeros(N)
R = np.zeros(N)

# ── Pad (sierras desafinadas, filtradas) ──
for b, ch in enumerate(chords):
    n = int(BAR * SR * 1.15)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for note in ch:
        for det in (-0.08, 0.0, 0.08):
            f = hz(note + 12 + det)
            ph = rng.random()
            sig += 2 * ((f * t + ph) % 1) - 1
    sig = lp(sig, 1400) * env_adsr(n, 0.8, 0.5, 0.85, 1.2) * 0.022
    place(L, sig * 0.9, b * BAR)
    place(R, np.roll(sig, 220) * 1.0, b * BAR)

# ── Piano eléctrico (FM suave) en el 1 y en el "y" del 2 ──
def epiano(midi, dur, vel):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    mod = np.sin(2 * np.pi * f * 2 * t) * 1.2 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * f * t + mod) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 9)
    return s * np.exp(-t * 2.2) * env_adsr(n, 0.004, 0.1, 0.9, 0.25) * vel

for b, ch in enumerate(chords):
    for pos, vel in ((0, 0.055), (1.5, 0.04), (3, 0.035)):
        for k, note in enumerate(ch):
            s = epiano(note + 12, BEAT * 1.6, vel)
            place(L, s * (1.0 - k * 0.12), b * BAR + pos * BEAT + k * 0.008)
            place(R, s * (0.6 + k * 0.12), b * BAR + pos * BEAT + k * 0.008)

# ── Bajo ──
def bass(midi, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
    s = np.tanh(s * 1.4) * env_adsr(n, 0.005, 0.15, 0.7, 0.08)
    return lp(s, 600) * 0.16

for b, r in enumerate(roots):
    for pos, d, off in ((0, 1.4, 0), (1.5, 0.45, 0), (2, 1.0, 0), (3.5, 0.45, 7)):
        s = bass(r + off, d * BEAT)
        place(L, s, b * BAR + pos * BEAT)
        place(R, s, b * BAR + pos * BEAT)

# ── Batería ──
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.5

def clap():
    n = int(0.3 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n)
    s = hp(lp(s, 3500), 900) * (np.exp(-t * 22) + 0.5 * np.exp(-((t - 0.012) % 0.011) * 300) * (t < 0.035))
    return s * 0.11

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    s = hp(rng.standard_normal(n), 7500) * np.exp(-t * (14 if open_ else 70))
    return s * (0.05 if open_ else 0.04)

swing = 0.06 * BEAT
for b in range(BARS):
    if b < 2:  # intro: sin batería, solo pad y piano
        continue
    base = b * BAR
    for beat in (0, 2.5):
        k = kick(); place(L, k, base + beat * BEAT); place(R, k, base + beat * BEAT)
    for beat in (1, 3):
        c = clap(); place(L, c * 0.9, base + beat * BEAT); place(R, c, base + beat * BEAT + 0.004)
    for e in range(8):
        h = hat(open_=(e == 7))
        tt = base + e * BEAT / 2 + (swing if e % 2 else 0)
        place(L, h * (1.0 if e % 2 else 0.7), tt); place(R, h * (0.7 if e % 2 else 1.0), tt)

# ── Melodía (pluck), desde el compás 5 ──
def pluck(midi, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(midi)
    s = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8)) * np.exp(-t * 4.5)
    return s * env_adsr(n, 0.003, 0.05, 1, 0.1) * 0.07

motif = [(0, 72), (0.75, 76), (1.5, 79), (2.5, 77), (3, 76)]
motif2 = [(0, 69), (0.5, 72), (1.5, 76), (2, 74), (3, 72), (3.5, 71)]
for b in range(4, BARS):
    m = motif if (b // 2) % 2 == 0 else motif2
    shift = {0: 0, 1: -1, 2: -2, 3: -3}[b % 4] if b < 8 else 0
    for pos, note in m:
        if b % 2 == 1 and pos > 2:
            continue
        s = pluck(note + shift * 0, BEAT * 1.2)
        place(L, s * 0.8, b * BAR + pos * BEAT); place(R, s * 1.0, b * BAR + pos * BEAT + 0.012)

# ── Reverb (impulso de ruido que decae), circular para no cortar el loop ──
def reverb(x, secs=2.4, mix=0.22):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 3.0)
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(np.concatenate([x, x]), ir)[N:2 * N]
    return x * (1 - mix) + wet * mix

L, R = reverb(L), reverb(R)

# Mezcla final: un poco de compresión suave y normalizar
mix = np.stack([L, R], axis=1)
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 0.89 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else 'four-theme.wav'
from scipy.io import wavfile
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('ok', out, round(LOOP, 2), 's')
