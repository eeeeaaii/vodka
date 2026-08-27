"""Turn a sample of any length into the ~10s window CLAP expects.

CLAP embeds a fixed window at 48kHz. A 32ms drum hit padded with 9.97s of
silence embeds mostly silence, so short samples are repeated instead. How they
repeat depends on what they are:

  - a decaying one-shot is repeated with a gap, preserving the hit-then-space
    shape that makes it read as a percussive event
  - a sustained periodic tone is tiled seamlessly on cycle boundaries, so it
    reads as a continuous tone rather than a stutter

Long samples are truncated to the window; the caller can chunk instead.
"""
import numpy as np, wave

TARGET_SR = 48000
WINDOW_S  = 10.0

def load(path):
    w = wave.open(path)
    p = w.getparams()
    dt = {1: np.uint8, 2: np.int16, 4: np.int32}[p.sampwidth]
    d = np.frombuffer(w.readframes(p.nframes), dtype=dt).astype(np.float64)
    w.close()
    if p.nchannels > 1:
        d = d.reshape(-1, p.nchannels).mean(axis=1)
    if p.sampwidth == 1:
        d -= 128
    peak = np.abs(d).max() or 1.0
    return d / peak, p.framerate

def resample(d, sr, target=TARGET_SR):
    if sr == target:
        return d
    n = int(round(len(d) * target / sr))
    return np.interp(np.linspace(0, len(d) - 1, n), np.arange(len(d)), d)

def describe(d, sr):
    """Envelope and periodicity, enough to choose a repeat strategy."""
    n = len(d)
    w = max(1, int(sr * 0.005))
    env = np.sqrt(np.convolve(d ** 2, np.ones(w) / w, mode='same'))
    peak = env.max() or 1.0
    sustain = float(env[int(n * 0.8):].mean() / peak)
    x = d - d.mean()
    lo, hi = max(2, int(sr / 2000)), min(n // 2, int(sr / 40))
    periodic, lag = 0.0, 0
    if hi > lo:
        nfft = 1 << (2 * n - 1).bit_length()
        F = np.fft.rfft(x, nfft)
        ac = np.fft.irfft(F * np.conj(F), nfft)[:n]
        ac = ac / (ac[0] + 1e-12)
        seg = ac[lo:hi]
        if len(seg):
            i = int(seg.argmax())
            periodic, lag = float(seg[i]), lo + i
    return sustain, periodic, lag

def is_sustained(sustain, periodic):
    return sustain > 0.35

def to_window(path):
    """Return (audio, kind) where audio is exactly WINDOW_S at TARGET_SR."""
    d, sr = load(path)
    d = resample(d, sr)
    sr = TARGET_SR
    want = int(WINDOW_S * sr)

    if len(d) >= want:
        return d[:want], 'truncated'

    sustain, periodic, lag = describe(d, sr)

    if is_sustained(sustain, periodic):
        # tile on a cycle boundary so the seam doesn't click
        body = d[:(len(d) // lag) * lag] if lag and len(d) >= lag * 2 else d
        if len(body) < lag or lag == 0:
            body = d
        reps = int(np.ceil(want / len(body)))
        out = np.tile(body, reps)[:want]
        kind = 'seamless-loop' if periodic > 0.6 else 'seamless-loop-noise'
    else:
        # hit, then space -- period at least 0.4s so it reads as separate events
        period = max(len(d) * 2, int(0.4 * sr))
        cell = np.zeros(period)
        cell[:len(d)] = d
        reps = int(np.ceil(want / period))
        out = np.tile(cell, reps)[:want]
        kind = 'gapped-loop'
    return out, kind
