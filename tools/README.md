# tools

Command line odds and ends. Nothing here is needed to run vodka; these are for
getting things into and out of it.

## What you need

**Python packages** are in `requirements.txt`. Install them into a virtual
environment:

    python3 -m venv .venv-audio
    .venv-audio/bin/pip install -r tools/requirements.txt

A virtual environment rather than `pip3 install numpy`, because a Python
installed by Homebrew refuses to let pip write into it — you get
`error: externally-managed-environment`, which is PEP 668 doing its job rather
than anything being broken.

**gstreamer** is needed by `audio2vodka.py`, which shells out to
`gst-launch-1.0` to decode. It is not a Python package:

    brew install gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-plugins-ugly

`gst-plugins-good` covers wav and flac. mp3 lives in one of `bad`/`ugly`
depending on the version, so install both if you want mp3. On Debian the
equivalents are `gstreamer1.0-tools` and the matching `gstreamer1.0-plugins-*`.

## The tools

- **`audio2vodka.py`** — turns an mp3, wav, or anything else gstreamer can
  decode into a vodka save file holding wavetables. Resamples to 48kHz, which
  is the rate vodka plays wavetables back at. `--stereo` gives an org of two
  wavetables instead of merging; `--seconds N` takes only the first N.
- **`akwf/`** — the Adventure Kid single cycle waveform library, and what was
  used to pick the ones in `server/waves`.
- **`soundcatalog/`** — how the sample library was named before the official
  ALM bank reference was used instead. Its output under `out/` refers to the
  names it guessed, which are no longer the names on disk.

## server/tools

Separate from these, and run with node rather than python:

- **`normalize-audio-names.py`** — renames everything in the audio libraries to
  something you can type after a dot. Idempotent, so it is safe to rerun after
  adding samples.
- **`createnamedsession.js`**, **`makestatic.js`**.
