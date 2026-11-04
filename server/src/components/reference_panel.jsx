import { frequencyForNoteNum } from '../wavetablefunctions.js';
import { SETTABLE } from '../nexstyle.js';
import { ALLOWED_PAINT as SURFACE_PAINT } from '../nex/surface.js';

/*
One number, one pitch. The nn timebase and midi agree: A440 is 69 in both, and
what send-midi-note is given is what nn names.

They used to be twelve apart, and this table had a column for each. Documents
written then mean a pitch an octave lower than they used to.

Frequencies come from the engine's own function, so if the reference pitch ever
moves this table moves with it.

(comment by Claude)
*/

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteName(midi) {
    // scientific pitch notation, in which middle C is C4 and is midi 60
    // (comment by Claude)
    return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

function formatHz(hz) {
    if (hz >= 1000) return hz.toFixed(1);
    if (hz >= 100) return hz.toFixed(2);
    return hz.toFixed(3);
}

// C4, which is the one on the piano you count from and the one nobody can ever
// remember the number of
// (comment by Claude)
const MIDDLE_C = 60;

const Row = ({ midi }) => {
    let hz = frequencyForNoteNum(midi);
    let middle = (midi == MIDDLE_C);
    return (
        <tr className={middle ? 'noterefmiddle' : ''}>
            <td className="noterefname">{noteName(midi)}</td>
            <td className="noterefnum">{midi}</td>
            <td className="noterefhz">{formatHz(hz)}</td>
            <td className="noterefnote">{middle ? 'middle C' : ''}</td>
        </tr>
    );
};

const ReferencePanel = () => {
    let rows = [];
    for (let midi = 0; midi <= 127; midi++) {
        rows.push(<Row key={midi} midi={midi} />);
    }
    return (
        <div className="infopanel">
            <p className="infotitle">Timebases</p>

            <p className="infolinemargin">
                Sound is measured in samples, 48000 to the second. Every length
                a sound builtin takes becomes a number of samples. The number
                can be tagged with a unit; the tag is the unit. There are six:
            </p>
            <p className="infospacer"></p>
            <p className="infoline"><span className="infohotkey">samp</span>a raw sample count. Also <span className="infohotkey">sample</span><span className="infohotkey">samps</span><span className="infohotkey">samples</span></p>
            <p className="infoline"><span className="infohotkey">sec</span>seconds. <span className="infohotkey">#2&lt;sec&gt;</span>is 96000 samples. Also <span className="infohotkey">secs</span><span className="infohotkey">second</span><span className="infohotkey">seconds</span></p>
            <p className="infoline"><span className="infohotkey">ms</span>milliseconds. Also <span className="infohotkey">millis</span><span className="infohotkey">milliseconds</span></p>
            <p className="infoline"><span className="infohotkey">b</span>beats at the global tempo. One beat at 120 bpm is half a second. Also <span className="infohotkey">beat</span><span className="infohotkey">beats</span></p>
            <p className="infoline"><span className="infohotkey">hz</span>one cycle at that frequency. <span className="infohotkey">#440&lt;hz&gt;</span>is 109 samples. Also <span className="infohotkey">Hz</span><span className="infohotkey">HZ</span><span className="infohotkey">cps</span></p>
            <p className="infoline"><span className="infohotkey">nn</span>one cycle at that note's pitch. <span className="infohotkey">#69&lt;nn&gt;</span>is the same length as <span className="infohotkey">#440&lt;hz&gt;</span>. Also <span className="infohotkey">note</span></p>
            <p className="infospacer"></p>

            <p className="infosubheader">Pitch is a length</p>
            <p className="infolinemargin">
                <span className="infohotkey">hz</span>and
                <span className="infohotkey">nn</span>name a pitch, but as a
                length: one cycle. A wavetable loops when played, so a
                sinewave <span className="infohotkey">#69&lt;nn&gt;</span>long
                is one cycle of a sine and sounds at A440. This is how
                oscillators are tuned.
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Untagged numbers</p>
            <p className="infolinemargin">
                An untagged length is read in the default timebase, which
                starts as beats. <span className="infohotkey">set-default-timebase</span>sets
                it from the tags on its argument;
                <span className="infohotkey">get-default-timebase</span>reads it back.
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Tempo</p>
            <p className="infolinemargin">
                Beats follow the global tempo, which starts at 120 bpm.
                <span className="infohotkey">set-bpm</span>changes it at once;
                <span className="infohotkey">queue-bpm</span>changes it on
                the next downbeat;
                <span className="infohotkey">get-bpm</span>reads it.
            </p>
            <p className="infolinemargin">
                A beat length is spent the moment a wave is made. The wave
                holds samples, not beats: one beat at 120 bpm becomes 24000
                samples, and stays 24000 samples when the tempo changes. The
                length readout measures against the current tempo, so after
                <span className="infohotkey">set-bpm 60</span>the same wave
                reads 0.5 b. The wave did not change; the beat did.
            </p>
            <p className="infolinemargin">
                A midi note whose duration is in beats is shortened by 5 ms so
                its note off lands before the next note on. Durations in any
                other timebase are played exactly as asked.
            </p>
            <p className="infolinemargin">
                Neither the tempo nor the default timebase is saved with a
                session. Put the <span className="infohotkey">set-bpm</span>and
                <span className="infohotkey">set-default-timebase</span>calls
                in the document and they run when it does.
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Going the other way</p>
            <p className="infolinemargin">
                <span className="infohotkey">duration</span>answers in samples;
                tag the command itself with a timebase for another unit.
                <span className="infohotkey">brightness</span>answers in hz the
                same way. The length readout above a wave shows its length in
                one timebase; click it to cycle.
            </p>
            <p className="infolinemargin">
                <span className="infohotkey">timebase-convert</span>converts a
                value to the timebase the command itself is tagged with,
                whatever the value was tagged: inside a function,
                <span className="infohotkey">~(&lt;samples&gt;timebase-convert @a)</span>is
                @a as samples no matter how the caller tagged it. The answer
                carries the new tag.
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Relative timebases</p>
            <p className="infolinemargin">
                <span className="infohotkey">ratio</span>
                <span className="infohotkey">semitones</span>and
                <span className="infohotkey">cents</span>move a pitch instead
                of naming a duration. A ratio of 2 is up an octave, which is
                12 semitones, which is 1200 cents; 100 cents is a semitone.
                Also <span className="infohotkey">cent</span>
                <span className="infohotkey">semitone</span>
                <span className="infohotkey">semi</span>
                <span className="infohotkey">semis</span>
            </p>
            <p className="infolinemargin">
                <span className="infohotkey">resample</span>reads its amount in
                any timebase: a relative one scales the wave, untagged meaning
                ratio, and a length timebase resamples the wave to that length
                (note the assumption that the original wave is exactly one
                cycle).
                <span className="infohotkey">pitch-shift</span>keeps the
                length, so it takes only relative timebases, untagged meaning
                semitones.
            </p>
            <p className="infospacer"></p>

            <p className="infotitle">Styles</p>
            <p className="infolinemargin">
                <span className="infohotkey">set-style of</span>takes a string
                of css and a nex, and adds that style to the nex. Only a doc, a
                line, a word, a letter or a separator can have one. The style
                shows only in normal mode, so a style meant for a finished
                interface never rearranges the code that built it.
                <span className="infohotkey">get-style of</span>reads it back.
            </p>
            <p className="infolinemargin">
                Adding, not replacing: a property you name again takes its new
                value and keeps its place, and everything else stays. To take a
                property off, give it no value at all --
                <span className="infohotkey">border:;</span>-- which is not
                valid css and so cannot mean anything else. Removing takes the
                whole family, so that also removes
                <span className="infohotkey">border-width</span>and the rest of
                them; <span className="infohotkey">border-radius:;</span>removes
                only the radius, and <span className="infohotkey">all:;</span>removes
                everything.
            </p>
            <p className="infospacer"></p>
            <p className="infolinemargin">
                Only the properties below are allowed, and anything else is an
                error that says so. <span className="infohotkey">background</span>is
                left out, because it can carry an image, and an image is a
                url; use <span className="infohotkey">background-color</span>.
                Moving and turning are <span className="infohotkey">translate</span>,
                <span className="infohotkey">rotate</span>and
                <span className="infohotkey">scale</span>, each its own property.
            </p>
            <p className="infolinemargin">
                A few are vodka's own names:
                <span className="infohotkey">visibility</span>is hide, show or
                vanish (vanish takes up no space);
                <span className="infohotkey">relative-position</span>is true or
                false, and lets left and top move a thing;
                <span className="infohotkey">case</span>is upper or lower; and
                <span className="infohotkey">inset</span>clips a thing to a box
                inside it, the way css inset() does. In the org form,
                translate, scale and transform-origin can be an org of x and y,
                and inset an org of top, right, bottom and left.
            </p>
            <p className="infoline infoindent">
                {SETTABLE.join(', ')}
            </p>
            <p className="infospacer"></p>
            <p className="infolinemargin">
                A border shorthand with no style in it gets
                <span className="infohotkey">solid</span>added, and so does a
                border given only a width or a colour, because css defaults a
                border to none. The <span className="infohotkey">font</span>shorthand
                needs both a size and a family or the browser throws the whole
                declaration away without saying anything, so
                <span className="infohotkey">font-weight</span>and friends are
                the safer way to say it. Values are not checked: a value the
                browser does not understand is simply ignored.
            </p>
            <p className="infolinemargin">
                There is an older builtin, <span className="infohotkey">apply-css-style to</span>,
                which takes any css at all, replaces whatever style the nex
                had, and applies it in both modes. It still works and is on its
                way out.
            </p>
            <p className="infospacer"></p>

            <p className="infotitle">Surfaces</p>
            <p className="infolinemargin">
                A surface is a picture made of lines.
                <span className="infohotkey">make-surface</span>takes a width
                and a height in pixels and gives back an empty one. A surface
                is a list of paths, and a path is a list of points, each point
                a list of two numbers, x and y, measured from the top left:
            </p>
            <p className="infoline infoindent"><span className="infohotkey">((3 4) (238 43) (84 23))</span>a line from point to point</p>
            <p className="infoline infoindent"><span className="infohotkey">(("m" 3 4) ("d" 9 2))</span>a point can start with "m" to move there without drawing, or "d" to draw to it</p>
            <p className="infoline infoindent"><span className="infohotkey">("fill: #c33" (0 0) (10 0) (5 8))</span>a string at the front of a path says how to paint it</p>
            <p className="infospacer"></p>
            <p className="infolinemargin">
                There are no drawing builtins, because the list builtins
                already do it: drawing is putting a path in the surface
                (<span className="infohotkey">cram</span>), and erasing is
                taking one out (<span className="infohotkey">chop</span>). A
                path is drawn in the order its points are given, and the first
                point of a path is always a move.
            </p>
            <p className="infolinemargin">
                A mutable surface is shown as its paths, labelled with its
                size, so the numbers can be edited. An immutable one is shown
                as the picture. <span className="infohotkey">make-surface</span>gives
                back a mutable one, and evaluating it at the top level makes it
                immutable; <span className="infohotkey">mutable</span>and
                <span className="infohotkey">immutable</span>switch it by hand.
                A path or point that cannot be read is skipped rather than
                being an error, so a typo does not break the picture.
            </p>
            <p className="infolinemargin">
                The paint string is written like css. A path with no paint is a
                thin line in the text colour. These are what it can set:
            </p>
            <p className="infoline infoindent">
                {SURFACE_PAINT.join(', ')}
            </p>
            <p className="infolinemargin">
                Any value mentioning <span className="infohotkey">url</span>is
                ignored, so a surface can't load anything from outside vodka.
            </p>
            <p className="infospacer"></p>

            <p className="infotitle">Note numbers</p>
            <p className="infolinemargin">
                A note number names a pitch: A440 is 69, middle C is 60, each
                step is an equal-tempered semitone.
                <span className="infohotkey">midi</span>is the same number, and
                is what <span className="infohotkey">send-midi-note</span>and
                <span className="infohotkey">play-midi</span>take, 0 to 127.
            </p>
            <p className="infospacer"></p>

            <table className="noteref">
                <thead>
                    <tr>
                        <th>note</th>
                        <th>number</th>
                        <th>Hz</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
};

export default ReferencePanel;
