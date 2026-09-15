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

**ffmpeg** is needed by `audio2vodka.py`, which shells out to it to decode. It
is not a Python package, and it is one package everywhere:

    brew install ffmpeg          # macos
    apt install ffmpeg           # debian, ubuntu
    dnf install ffmpeg           # fedora

This used to be gstreamer, which does the same job but arrives as a base
package plus four or five plugin packages, and which codec is in which of them
is something you find out by the file failing to decode. ffmpeg's one package
covers everything here, and is likelier to already be on a machine that has no
desktop on it.

## The tools

- **`audio2vodka.py`** — turns an mp3, wav, mp4, or anything else ffmpeg can
  decode into a vodka save file holding wavetables. A video file works too:
  the picture is discarded and the soundtrack comes through like any other
  input. Resamples to 48kHz, which is the rate vodka plays wavetables back at.
  `--stereo` gives an org of two wavetables instead of merging; `--seconds N`
  takes only the first N.
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
