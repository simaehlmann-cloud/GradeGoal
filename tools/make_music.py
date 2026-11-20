"""Hintergrundmusik fuer das YouTube-Video – vollstaendig selbst erzeugt.

Keine Samples, keine fremden Aufnahmen: Jeder Ton wird hier aus Sinus-
und Rauschsignalen berechnet. Damit gibt es keine Lizenzfragen und kein
„Content ID“-Problem bei YouTube.

Stil: freundlich, leicht und ruhig treibend (ca. 104 BPM, C-Dur,
Akkordfolge C – G – Am – F). Flaechen, gezupfte Arpeggios, weicher Bass,
dezentes Schlagzeug ab dem dritten Takt, Ein- und Ausblendung.

Aufruf:  python3 tools/make_music.py <Dauer in Sekunden> <Ausgabe.wav>
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 104
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)  # feste Saat: jedes Mal dieselbe Musik


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, a, d, s, r, sustain_len):
    """ADSR-Huellkurve in Samples."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sus = max(0, int(sustain_len * SR) - a - d)
    e = np.concatenate([
        np.linspace(0, 1, max(a, 1), endpoint=False),
        np.linspace(1, s, max(d, 1), endpoint=False),
        np.full(sus, s),
        np.linspace(s, 0, max(r, 1)),
    ])
    out = np.zeros(n)
    out[: min(n, len(e))] = e[:n]
    return out


def tone(freq, dur, harmonics=(1.0,), detune=0.0, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    sig = np.zeros_like(t)
    for k, amp in enumerate(harmonics, start=1):
        sig += amp * np.sin(2 * np.pi * freq * k * (1 + detune) * t + phase * k)
    return sig


def lowpass(x, cutoff, order=2):
    sos = butter(order, cutoff, btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def highpass(x, cutoff, order=2):
    sos = butter(order, cutoff, btype="high", fs=SR, output="sos")
    return sosfilt(sos, x)


def add(buf, sig, start_s, gain=1.0, pan=0.0):
    i = int(start_s * SR)
    if i >= buf.shape[0]:
        return
    j = min(buf.shape[0], i + len(sig))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += sig[: j - i] * gain * l
    buf[i:j, 1] += sig[: j - i] * gain * r


# Akkorde (MIDI): C, G, Am, F – Grundton fuer den Bass, Toene fuer Flaeche/Arpeggio
CHORDS = [
    (48, [60, 64, 67, 72]),   # C
    (43, [59, 62, 67, 71]),   # G
    (45, [60, 64, 69, 72]),   # Am
    (41, [60, 65, 69, 72]),   # F
]
# Kleine Melodie (Glocke), je Takt vier Achtel-Paare, None = Pause
MELODY = [
    [76, None, 79, None, 77, 76, 74, None],
    [74, None, 79, None, 77, None, 74, 71],
    [72, None, 76, None, 79, 81, 79, None],
    [77, None, 76, None, 74, None, 72, None],
]


def build(duration):
    n = int((duration + 1) * SR)
    mix = np.zeros((n, 2))
    bars = int(np.ceil(duration / BAR)) + 1
    for b in range(bars):
        t0 = b * BAR
        root, notes = CHORDS[b % 4]

        # Flaeche: leicht verstimmt links/rechts, weich gefiltert
        for m in notes[:3]:
            for det, pan in ((-0.003, -0.6), (0.003, 0.6)):
                s = tone(hz(m), BAR + 0.6, harmonics=(1, .45, .22, .12, .06), detune=det)
                s = lowpass(s, 1800) * env(len(s), .35, .4, .7, .6, BAR)
                add(mix, s, t0, 0.045, pan)

        # Bass: Grundton auf 1 und 3, Achtel davor auf „und“ von 2
        for beat, length, g in ((0, 1.5, 1.0), (1.5, .5, .6), (2, 1.8, .9)):
            s = tone(hz(root), BEAT * length + .1, harmonics=(1, .35, .1))
            s *= env(len(s), .01, .15, .6, .12, BEAT * length)
            add(mix, s, t0 + beat * BEAT, 0.20 * g)

        # Gezupftes Arpeggio in Achteln (ab Takt 2)
        if b >= 1:
            pattern = [0, 1, 2, 3, 2, 1, 2, 3]
            for i, p in enumerate(pattern):
                m = notes[p] + 12
                s = tone(hz(m), .5, harmonics=(1, .5, .25, .12))
                s *= np.exp(-np.arange(len(s)) / SR * 9)
                add(mix, lowpass(s, 4200), t0 + i * BEAT / 2, 0.05, -0.35 if i % 2 else 0.35)

        # Glockenmelodie ab Takt 5
        if b >= 4:
            for i, m in enumerate(MELODY[b % 4]):
                if m is None:
                    continue
                s = tone(hz(m), 1.2, harmonics=(1, 0, .3, 0, .1)) + .25 * tone(hz(m) * 2.76, 1.2)
                s *= np.exp(-np.arange(len(s)) / SR * 3.2)
                add(mix, s, t0 + i * BEAT / 2, 0.035, 0.15)

        # Schlagzeug ab Takt 3
        if b >= 2:
            for beat in range(4):
                tb = t0 + beat * BEAT
                if beat in (0, 2):  # Kick: abfallender Sinus
                    k = np.arange(int(.35 * SR)) / SR
                    f = 48 + 90 * np.exp(-k * 28)
                    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 9)
                    add(mix, kick, tb, 0.30)
                if beat in (1, 3):  # weicher Klatscher: gefiltertes Rauschen
                    c = highpass(rng.standard_normal(int(.25 * SR)), 900)
                    c = lowpass(c, 5000) * np.exp(-np.arange(len(c)) / SR * 22)
                    add(mix, c, tb, 0.05)
                for h in (0, .5):  # Hi-Hat in Achteln
                    hh = highpass(rng.standard_normal(int(.06 * SR)), 7000)
                    hh *= np.exp(-np.arange(len(hh)) / SR * 70)
                    add(mix, hh, tb + h * BEAT, 0.018 if h else 0.026, 0.25)

    mix = mix[: int(duration * SR)]
    # Ein- und Ausblenden
    fi, fo = int(1.0 * SR), int(2.5 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    # Sanfte Saettigung, dann auf -1,5 dB Spitze normieren
    mix = np.tanh(mix * 1.6)
    mix *= 10 ** (-1.5 / 20) / max(1e-9, np.abs(mix).max())
    return (mix * 32767).astype(np.int16)


if __name__ == "__main__":
    dur = float(sys.argv[1])
    out = sys.argv[2]
    wavfile.write(out, SR, build(dur))
    print(f"{out}: {dur:.1f} s Musik")
