# Parametric fonts

A parametric font ("pfont") is a font whose letters are drawn from numbers. Change a number, like how tall a lowercase letter is or how round the curves are, and every letter is redrawn to match. Because they are just numbers, they can be animated. The idea comes from Knuth's METAFONT; the original design notes are in [CHANGEBLOG.txt](CHANGEBLOG.txt) under "fonts".

There is one font so far, **basic**.

## Using one

    ~"apply-pfont to"(_$"basic##" [doc](|...|)_)

`apply-pfont to` takes a font string and a doc, line, word, letter or separator, gives it the font, and returns it. The name has a space in it, which is why it is written in quotes.

A pfont shows only in **normal mode**: a result, or a `:draw` face. While you are editing (exploded mode) the text is plain, so a font never gets in the way of the code that made it. Evaluate a doc to see its font.

## The font string

    fontname#pixelparams#relativeparams

- `basic##` is basic with every default.
- `basic#fontsize:40#` sets the size to 40 pixels.
- `basic#fontsize:40#corpus:0.5,curve:0` also makes a tall lowercase with square corners.

Each params section is `name:number` pairs separated by commas. Either section can be left out (`basic` is the same as `basic##`), and spaces around names and numbers are ignored. An unknown font name means basic.

A param name the font does not have, a param in the wrong section, or a value that is not a number is an error from `apply-pfont to`, so a typo does not silently do nothing. (Loading a saved file is lenient and ignores them.) A pfont string cannot contain `|`.

### Pixel params (first section)

| param | default | means |
|---|---|---|
| fontsize | 90 | the height of the font, in pixels |
| left_kerning | 0 | extra space on the left of each letter, in pixels |
| right_kerning | 0 | extra space on the right of each letter, in pixels |
| slop | 0 | extra room around each letter for strokes that leave it; 0 means work it out |

### Relative params (second section)

These are fractions of the font size, measured up from the baseline, so 0.3 at a font size of 90 is 27 pixels.

| param | default | means |
|---|---|---|
| cap | 0.6 | height of a capital letter |
| asc | 0.7 | height of an ascender, like the top of an l |
| desc | -0.3 | depth of a descender, like the bottom of a g |
| corpus | 0.3 | x-height: the height of a lowercase x |
| bar | corpus / 2 | height of the crossbar in an e |
| curve | corpus * 0.28 | how round the curves are; 0 is square |
| aperture | 0.7 | how far round a c or e closes, 0 to 1 |
| linethickness | 0.05 | width of the pen |
| leading | 0.1 | space between lines |
| tracking | 0.1 | space between letters |
| nominalwidth | 0.4 | how wide letters are |
| baseline_from_top | 0.7 | where the baseline sits, measured down from the top |

`bar` and `curve` follow `corpus` unless you set them yourself.

Every letter, digit and the common symbols `. , ; : - ? ' " ! ( ) [ ] { } / \ + = * & # @ % < > _ | ~ $ ^` have glyphs. A character basic has no glyph for is drawn as an empty box, so it shows up as missing rather than as some other letter.

## Nesting: last write wins

Applying a pfont sets it on that nex and on everything inside it, replacing whatever was there. A letter added later gets the font of the word it goes into. So a letter's font is whatever was last applied to it or to anything containing it. There is no inheritance and no merging of params.

- Apply a font to a word, then a different one to its line: the line's font replaces the word's.
- Apply a font to a line, then a different one to a word in it: the word keeps its own.

The empty string removes a pfont: `~"apply-pfont to"(_$"" @thing_)` makes it, and everything inside it, plain text again.

## Animating

Apply a new font string each frame. The `animation` package does this for you:

    ~(_animation:osc-pfont @doc &" val"(|~(|string-cat $"basic##corpus:" ~(_to-string @val_) $|)|) %0.1 %0.6_)

swings `corpus` between 0.1 and 0.6 forever. See `server/samples/pfonttest`.

Changing a param that only affects shape (corpus, curve, aperture, cap and so on) just repaints. Changing one that moves letters (fontsize, nominalwidth, tracking, kerning, leading, slop) lays the text out again first. Neither re-renders the document.

## Saving and copying

A pfont is saved with the document and kept when you copy. It is written only where it differs from the thing containing it, so a doc with one font stores the string once. Documents without pfonts are saved exactly as before.

## Colour

Pfont text is drawn in the text colour, so it follows the light and dark themes. A colour set with `set-style of` on the doc, line, word or letter is used too.

## How it is drawn

In normal mode, a doc, line or word with a pfont that holds nothing but plain text (a doc of lines, a line of words, letters and separators, a word of letters and separators) is drawn into **one canvas**. Lines wrap where the plain text would have wrapped, punctuation stays with the word before it, and words of different sizes in one row share a baseline. The text is put in the canvas's aria-label for screen readers.

Anything else (a number or a command inside a line, a style other than a colour inside, tags or click handlers inside) is drawn the older way, with a small canvas per letter. That works for everything but is much slower to animate.

## Adding a font

A font is a file in `server/src/pfonts/` that subclasses `Font` (see `basic.js`):

- `getFontName()` returns its name, the first part of a font string.
- `getDefaultParams()` and `getDefaultPxparams()` return its params and their defaults. These are also the names `apply-pfont to` accepts.
- `setDerivedParams(params, inparams)` works out params that follow others, like basic's `bar` and `curve`, unless they are in `inparams`.
- `getGlyphs()` returns the glyph table: each character maps to a `Glyph(width, instructions)`, and each instruction is a drawing op (`OP_MOVE`, `OP_LINE`, `OP_BEZIER`, `OP_BEZIERPLOT`) with points written as functions of the params, like `{ x:p => (p.mid), y:p => (p.corpus) }`.

Then add it to the registry in `pfontmanager.js`.

A `Font` is made once per font string and never changes. Everything the string was applied to shares it, and it remembers each character's drawn shape, so a doc full of e's works out one e.

## Where the code is

| file | what |
|---|---|
| `pfonts/pfontmanager.js` | font registry, parsing and checking font strings |
| `pfonts/font.js` | the `Font` base class: params, glyph geometry, advances |
| `pfonts/basic.js` | the basic font and its glyphs |
| `pfonts/pfontnex.js` | what a doc, line and word do with a pfont: last write wins, saving, loading |
| `pfonts/pfontblock.js` | drawing a block of text into one canvas |
| `nex/letter.js` | a letter's pfont, and the per-letter way of drawing |
| `builtins/syscalls.js` | `apply-pfont to` |
| `testing/alltests/pfont_*` | tests |
