Single-cycle waveforms, 600 samples each, 16-bit mono, tuned to D2+2.

These are a 299-wave subset of the AKWF-FREE collection:

    https://github.com/KristofferKarlAxelEkstrand/AKWF-FREE

which is released under CC0 (public domain dedication), as is this subset.

The folders are not part of the original collection. Four of them sort waves by
measured harmonic character:

    bright     fundamental-led with strong upper harmonics, saw-like
    dense      many harmonics, smooth rolloff, fundamental dominant
    hollow     energy on a low overtone rather than the fundamental, reedy
    metallic   loudest partial well above the fundamental, bell-like

and the rest name the kind of sound the wave was taken from, which is usually
the more useful way in:

    voice organ epiano piano plucked strings winds bass
    fm chip game granular distorted theremin birds
    saw square sine triangle perfect blended linear symmetric overtone hdrawn

"perfect" holds the textbook saw, square, sine and triangle. Along with "sine"
and "triangle" it is the plain end of the library -- the four measured folders
above are all 111 to 150 harmonics deep, so on their own there was nothing
simple to interpolate toward.

tools/akwf/akwf-list.txt records which original file each wave came from and
what it measured. tools/akwf/select-akwf.py is what chose them: rather than
ranking by harmonic complexity, which just returns 150 versions of the same
busy wave, it picks by farthest-point sampling on the spectrum, so each wave
added is the one least like everything already in. tools/akwf/fetch-akwf.sh
downloads whatever the list names.
