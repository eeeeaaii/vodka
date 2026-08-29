#!/usr/bin/env python3
"""Turn an mp3 or wav into a vodka save file containing wavetables.

    audio2vodka.py drums.mp3                 one wavetable, channels merged
    audio2vodka.py --stereo drums.mp3        an org holding two wavetables
    audio2vodka.py --seconds 4 long.wav      just the first four seconds

Decoding is done by gstreamer, so anything gstreamer can read works, not only
mp3 and wav. Everything is resampled to 48kHz because that is the rate vodka
plays wavetables back at (SAMPLE_RATE in webaudio.js); a 44.1kHz file left
alone would come out slightly sharp.

Merging is not an average. The peak of the whole file is measured across both
channels first, the channels are summed, and the sum is scaled back down so its
loudest point matches that original peak. A file that is really mono comes
through this untouched: summing two identical channels doubles the peak, and
scaling back to the original peak halves it again.

Output is the container format -- the document, then the samples it refers to,
in one file. Pass --inline to get samples written into the document instead,
which is what vodka wrote before containers and what older builds can read.
"""

import argparse, base64, os, re, subprocess, sys, tempfile
import numpy as np

# what vodka plays wavetables back at -- see SAMPLE_RATE in webaudio.js
SAMPLE_RATE = 48000

# server/webserver.js rejects a save whose filename is not this shape
LEGAL_FILENAME = re.compile(r'^[a-zA-Z0-9_.-]+$')

CONTAINER_MAGIC = 'VODKAC1'


def decode(path, seconds=None):
    """Returns an (n, 2) float32 array at SAMPLE_RATE. Raises on failure."""
    if not os.path.isfile(path):
        raise SystemExit(f'audio2vodka: no such file: {path}')

    raw = tempfile.NamedTemporaryFile(suffix='.raw', delete=False)
    raw.close()
    # Always decoded as stereo. A mono source arrives as two identical
    # channels, which the merge below collapses back to exactly the original.
    caps = (f'audio/x-raw,format=F32LE,rate={SAMPLE_RATE},'
            f'channels=2,layout=interleaved')
    cmd = ['gst-launch-1.0', '-q',
           'filesrc', f'location={path}', '!', 'decodebin', '!',
           'audioconvert', '!', 'audioresample', '!', caps, '!',
           'filesink', f'location={raw.name}']
    try:
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit('audio2vodka: could not decode ' + path + '\n'
                             + (r.stderr.strip() or r.stdout.strip()))
        data = np.fromfile(raw.name, dtype='<f4')
    finally:
        os.unlink(raw.name)

    if data.size == 0:
        raise SystemExit(f'audio2vodka: {path} decoded to no audio at all')
    # a torn final frame would break the reshape
    data = data[:(data.size // 2) * 2]
    stereo = data.reshape(-1, 2)
    if seconds is not None:
        stereo = stereo[:int(seconds * SAMPLE_RATE)]
    return stereo


def merge(left, right):
    """Sum the channels, then scale the sum back to the original peak."""
    peak = float(max(np.abs(left).max(), np.abs(right).max()))
    summed = left + right
    summed_peak = float(np.abs(summed).max())
    # Silence, or two channels exactly out of phase. Nothing to scale to, and
    # scaling would divide by zero.
    if summed_peak == 0.0 or peak == 0.0:
        return summed
    return summed * (peak / summed_peak)


def to_base64(samples):
    return base64.b64encode(np.asarray(samples, dtype='<f4').tobytes()).decode('ascii')


def wavetable(private_data):
    return f'[wavetable]"{private_data}"'


def org(children):
    # (| ... |) is a vertical org, which is the direction a new one has
    return '(|' + ' '.join(children) + '|)'


def build(channels, inline):
    """channels is a list of sample arrays. Returns the file's text."""
    if inline:
        nexes = [wavetable(to_base64(c)) for c in channels]
        doc = 'v2:' + (nexes[0] if len(nexes) == 1 else org(nexes))
        return doc, len(channels)

    # Identical channels are stored once and referred to twice, which is what
    # the app's collector does when it walks a document.
    encoded, refs = [], []
    seen = {}
    for c in channels:
        b = to_base64(c)
        if b not in seen:
            seen[b] = len(encoded)
            encoded.append(b)
        refs.append(f'aud:{seen[b]}')

    nexes = [wavetable(r) for r in refs]
    doc = 'v2:' + (nexes[0] if len(nexes) == 1 else org(nexes))
    header = [CONTAINER_MAGIC, str(len(doc))] + [str(len(e)) for e in encoded]
    return ' '.join(header) + '\n' + doc + ''.join(encoded), len(encoded)


def main():
    p = argparse.ArgumentParser(
            description='Convert an audio file into a vodka save file.',
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog='Copy the result into a session directory to load it:\n'
                   '  server/sessions/<id>/  or  server/namedsessions/<name>/')
    p.add_argument('input', help='an mp3, wav, or anything gstreamer decodes')
    p.add_argument('-o', '--output',
                   help='output filename (default: the input name, no suffix)')
    g = p.add_mutually_exclusive_group()
    g.add_argument('--merge', action='store_true', default=True,
                   help='one wavetable, channels summed (the default)')
    g.add_argument('--stereo', action='store_true',
                   help='an org holding one wavetable per channel')
    p.add_argument('--seconds', type=float,
                   help='use only the first N seconds')
    p.add_argument('--inline', action='store_true',
                   help='write samples into the document rather than as a '
                        'container, for builds without container support')
    args = p.parse_args()

    stereo = decode(args.input, args.seconds)
    left, right = stereo[:, 0].copy(), stereo[:, 1].copy()
    is_mono = np.array_equal(left, right)

    if args.stereo:
        channels = [left, right]
    else:
        channels = [merge(left, right)]

    text, stored = build(channels, args.inline)

    out = args.output or os.path.splitext(os.path.basename(args.input))[0]
    if not LEGAL_FILENAME.match(os.path.basename(out)):
        raise SystemExit(
            f"audio2vodka: '{os.path.basename(out)}' is not a legal vodka "
            'filename. The server only accepts letters, digits, dot, dash '
            'and underscore. Pass -o with a different name.')
    with open(out, 'w') as f:
        f.write(text)

    seconds = len(channels[0]) / SAMPLE_RATE
    peak = max(float(np.abs(c).max()) for c in channels)
    print(f'audio2vodka: wrote {out}')
    print(f'  {seconds:.2f}s at {SAMPLE_RATE}Hz, '
          f'{len(channels)} wavetable{"" if len(channels) == 1 else "s"}, '
          f'{stored} sample block{"" if stored == 1 else "s"} stored')
    print(f'  {os.path.getsize(out) / 1048576:.1f}MB on disk')
    if is_mono and args.stereo:
        print('  note: both channels are identical, so this is really mono')
    if peak > 1.0:
        print(f'  note: peak is {peak:.3f}, above full scale -- the source '
              'was already clipping')
    if seconds > 30:
        print('  note: that is a long sample; vodka keeps every wavetable in '
              'memory, so it may hit the heap limit')


if __name__ == '__main__':
    main()
