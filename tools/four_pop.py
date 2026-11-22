"""Tema original "Four (pop ambiental)" para la página de Four Makeup.
Ambiental con base pop, 108 BPM, progresión I–V–vi–IV en Re mayor, 16 compases en loop sin cortes.
Batería pop (bombo, clap, hats en semicorcheas), bajo con octavas, acordes que "bombean",
arpegio pluck y un gancho tipo vocal chop sintetizado (sin voces ni melodías de otras canciones).
Uso: python3 four_pop.py salida.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
BPM = 108
BEAT = 60 / BPM
S16 = BEAT / 4
BAR = 4 * BEAT
BARS = 16
N = int(round(BARS * BAR * SR))
rng = np.random.default_rng(11)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def adsr(n, a, d, s, r):
    a, d, r = max(int(a * SR), 1), max(int(d * SR), 1), max(int(r * SR), 1)
    sus = max(n - a - d - r, 0)
    e = np.concatenate([np.linspace(0, 1, a), np.linspace(1, s, d), np.full(sus, s), np.linspace(s, 0, r)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def filt(x, f, kind='low', order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)


def bp(x, f, q=6):
    lo, hi = f / (1 + 1 / (2 * q)), f * (1 + 1 / (2 * q))
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def place(buf, sig, t):
    i = int(round(t * SR)) % N
    end = i + len(sig)
    if end <= N:
        buf[i:end] += sig
    else:
        c = N - i
        buf[i:] += sig[:c]
        rest = sig[c:]
        while len(rest):
            k = min(len(rest), N)
            buf[:k] += rest[:k]
            rest = rest[k:]


def saw(f, n, det=(0.0,)):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in det:
        ff = f * 2 ** (d / 1200)
        out += 2 * ((ff * t + rng.random()) % 1) - 1
    return out / len(det)


# Re mayor: D – A – Bm – G
CH = [[62, 66, 69, 74], [61, 64, 69, 73], [62, 66, 71, 74], [62, 67, 71, 74]]
ROOT = [38, 45, 47, 43]
chords = [CH[b % 4] for b in range(BARS)]
roots = [ROOT[b % 4] for b in range(BARS)]

# secciones: 0-3 intro (filtrada), 4-7 estrofa, 8-15 estribillo
def section(b):
    return 'intro' if b < 4 else ('verse' if b < 8 else 'chorus')

L = np.zeros(N); R = np.zeros(N)
# envolvente de "bombeo" (sidechain) en cada negra
pump = np.ones(N)
pk = int(BEAT * SR)
shape = 1 - 0.38 * np.exp(-np.arange(pk) / (0.09 * SR))
for b in range(BARS):
    if section(b) == 'intro':
        continue
    for q in range(4):
        i = int(round((b * BAR + q * BEAT) * SR)) % N
        e = min(i + pk, N)
        pump[i:e] *= shape[:e - i]

pumped_L = np.zeros(N); pumped_R = np.zeros(N)

# ── Acordes (supersaw) en corcheas sincopadas ──
stab_pat = [0, 1.5, 2.5, 3.5]
for b, ch in enumerate(chords):
    sec = section(b)
    if sec == 'intro':
        n = int(BAR * SR)
        s = sum(saw(hz(m), n, (-12, 0, 12)) for m in ch) / 4
        s = filt(s, 900 + 500 * (b % 4)) * adsr(n, 0.3, 0.2, 0.9, 0.3) * 0.3
        place(pumped_L, s, b * BAR); place(pumped_R, np.roll(s, 300), b * BAR)
        continue
    for pos in stab_pat:
        dur = BEAT * (0.9 if pos != 0 else 1.3)
        n = int(dur * SR)
        s = sum(saw(hz(m), n, (-14, -5, 5, 14)) for m in ch) / 4
        s = filt(s, 3000 if sec == 'chorus' else 1800) * adsr(n, 0.01, 0.15, 0.6, 0.12)
        vol = 0.10 if sec == 'chorus' else 0.07
        place(pumped_L, s * vol, b * BAR + pos * BEAT); place(pumped_R, np.roll(s, 180) * vol, b * BAR + pos * BEAT)

# ── Pad ambiental en todo el tema (más presente en el estribillo) ──
for b, ch in enumerate(chords):
    n = int(BAR * SR * 1.2)
    s = sum(saw(hz(m + 12), n, (-9, 0, 9)) for m in ch) / 4
    s = filt(s, 2200 if section(b) == 'chorus' else 1500) * adsr(n, 0.6, 0.4, 0.85, 0.8) * (0.09 if section(b) == 'chorus' else 0.07)
    place(pumped_L, s, b * BAR); place(pumped_R, np.roll(s, 400), b * BAR)

pumped_L *= pump; pumped_R *= pump
L += pumped_L; R += pumped_R

# ── Bajo con octavas en corcheas ──
def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(m) * t) + 0.5 * saw(hz(m), n)
    s = filt(np.tanh(s * 1.8), 900) * adsr(n, 0.004, 0.08, 0.75, 0.04)
    return s * 0.2

for b, r in enumerate(roots):
    if section(b) == 'intro':
        continue
    for e in range(8):
        m = r + (12 if e % 2 else 0)
        s = bass(m, S16 * 1.8)
        place(L, s * pump[int(((b * BAR + e * 2 * S16) * SR)) % N], b * BAR + e * 2 * S16)
        place(R, s * pump[int(((b * BAR + e * 2 * S16) * SR)) % N], b * BAR + e * 2 * S16)

# ── Batería ──
def kick():
    n = int(0.4 * SR); t = np.arange(n) / SR
    f = 48 + 140 * np.exp(-t * 35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    click = filt(rng.standard_normal(n), 3000, 'high') * np.exp(-t * 400) * 0.3
    return np.tanh((s + click) * 1.5) * 0.55

def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    noise = filt(filt(rng.standard_normal(n), 1100, 'high'), 6000)
    bursts = sum(np.exp(-np.clip(t - d, 0, None) * 220) * (t >= d) for d in (0, 0.009, 0.019))
    tail = np.exp(-t * 16)
    snare = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return (noise * (bursts * 0.6 + tail * 0.5) + snare) * 0.2

def hat(open_=False):
    n = int((0.22 if open_ else 0.045) * SR); t = np.arange(n) / SR
    return filt(rng.standard_normal(n), 8000, 'high') * np.exp(-t * (12 if open_ else 90)) * (0.06 if open_ else 0.045)

K, C = kick(), clap()
for b in range(BARS):
    sec = section(b); base = b * BAR
    if sec == 'intro':
        if b >= 1:  # hats suaves desde el compás 2
            for i in range(8):
                h = hat() * (0.5 if i % 2 else 0.3); place(L, h * 0.8, base + i * BAR / 8); place(R, h, base + i * BAR / 8)
        if b >= 2:
            place(L, K * 0.6, base); place(R, K * 0.6, base)
        if b == 3:  # redoble de entrada
            for i in range(8):
                c = C * (0.3 + 0.09 * i); place(L, c, base + 2 * BEAT + i * S16); place(R, c, base + 2 * BEAT + i * S16)
        continue
    kicks = [0, 1.75, 2.5, 3.5] if sec == 'chorus' else [0, 2.5]
    for k in kicks:
        place(L, K, base + k * BEAT); place(R, K, base + k * BEAT)
    for c in (1, 3):
        place(L, C, base + c * BEAT); place(R, C * 0.95, base + c * BEAT + 0.003)
    steps = 16 if sec == 'chorus' else 8
    for i in range(steps):
        pos = base + i * (BAR / steps)
        open_ = sec == 'chorus' and i % 4 == 2
        h = hat(open_) * (0.8 if i % 2 else 0.5)
        place(L, h * 0.8, pos); place(R, h, pos)

# ── Arpegio pluck (estrofa y estribillo) ──
def pluck(m, dur, vol):
    n = int(dur * SR); t = np.arange(n) / SR
    s = saw(hz(m), n, (-6, 6))
    cutoff_env = 600 + 5000 * np.exp(-t * 18)
    # filtro variable aproximado: mezcla de dos filtrados
    s = filt(s, 4000) * np.exp(-t * 9) * 0.6 + filt(s, 900) * np.exp(-t * 4) * 0.4
    return s * adsr(n, 0.002, 0.05, 1, 0.05) * vol

arp_idx = [0, 1, 2, 3, 2, 1, 3, 1]
for b, ch in enumerate(chords):
    if section(b) == 'intro':
        continue
    for i in range(16):
        m = ch[arp_idx[i % 8]] + 12
        p = pluck(m, S16 * 2.2, 0.05 if section(b) == 'chorus' else 0.06)
        side = 0.6 + 0.4 * (i % 2)
        place(L, p * side, b * BAR + i * S16); place(R, p * (1.6 - side), b * BAR + i * S16)

# ── Gancho tipo "vocal chop" (sintetizador con formantes de vocal) ──
VOWELS = {'a': (800, 1200, 2500), 'e': (400, 2000, 2600), 'o': (500, 900, 2400), 'u': (350, 800, 2300)}
def chop(m, dur, vowel, vol):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * (t > 0.08)
    ph = np.cumsum(hz(m) * vib) / SR
    src = 2 * (ph % 1) - 1
    f1, f2, f3 = VOWELS[vowel]
    s = bp(src, f1, 5) * 1.0 + bp(src, f2, 7) * 0.6 + bp(src, f3, 9) * 0.3
    return s * adsr(n, 0.01, 0.08, 0.8, 0.06) * vol

# gancho original de 2 compases (posición en corcheas, nota, duración en corcheas, vocal)
hook = [(0, 78, 1, 'o'), (1, 76, 1, 'e'), (2, 74, 2, 'a'), (5, 74, 1, 'o'), (6, 76, 1, 'e'), (7, 78, 1, 'a'),
        (8, 81, 2, 'o'), (10, 78, 1, 'e'), (11, 76, 2, 'a'), (14, 74, 1, 'u'), (15, 73, 1, 'e')]
for b in range(8, BARS, 2):
    last = b == BARS - 2
    for pos, m, d, v in hook:
        if last and pos >= 14:
            m = {74: 74, 73: 69}.get(m, m)
        s = chop(m, d * BEAT / 2 * 0.95, v, 0.34)
        place(L, s, b * BAR + pos * BEAT / 2); place(R, s, b * BAR + pos * BEAT / 2 + 0.006)
        # eco
        place(L, s * 0.22, b * BAR + pos * BEAT / 2 + 3 * BEAT / 4)
        place(R, s * 0.28, b * BAR + pos * BEAT / 2 + 3 * BEAT / 4 + 0.01)

# ── Subida (riser) de ruido antes del estribillo ──
n = int(2 * BAR * SR); t = np.arange(n) / SR
riser = filt(rng.standard_normal(n), 2000, 'high') * (t / t[-1]) ** 2 * 0.06
place(L, riser, 6 * BAR); place(R, riser[::-1][::-1], 6 * BAR)

# ── Reverb circular + master ──
def reverb(x, secs=2.6, mix=0.24):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = filt(rng.standard_normal(n) * np.exp(-t * 3.6), 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(np.concatenate([x, x]), ir)[N:2 * N]
    return x * (1 - mix) + wet * mix

L, R = reverb(L), reverb(R)
mix = np.stack([L, R], axis=1)
mix = filt(mix.T, 30, 'high').T
mix = np.tanh(mix * 1.7) / np.tanh(1.7)
mix *= 0.9 / np.max(np.abs(mix))
out = sys.argv[1] if len(sys.argv) > 1 else 'four-pop.wav'
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('ok', out, round(N / SR, 3), 's')
