import { frequencyForNoteNum } from '../wavetablefunctions.js';
import { ALLOWED } from '../nexstyle.js';
import { ALLOWED_PAINT as SURFACE_PAINT } from '../nex/surface.js';

// the few properties with something to know about them; the rest need nothing
// (comment by Claude)
const BORDER_NOTE = 'gets solid added if no style is given';
const STYLE_NOTES = {
    'background-color': 'the background shorthand is not allowed',
    'linear-gradient': 'a background gradient, e.g. linear-gradient: to right, red, blue',
    'border': BORDER_NOTE + '; border:; removes all border properties',
    'border-bottom': BORDER_NOTE,
    'border-color': BORDER_NOTE,
    'border-left': BORDER_NOTE,
    'border-right': BORDER_NOTE,
    'border-top': BORDER_NOTE,
    'border-width': BORDER_NOTE,
    'font': 'needs both a size and a family, or it is ignored',
    'margin': 'can be negative',
};

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

/*
A reference, not a how-to: every section is a table you look things up in.
(comment by Claude)
*/
const H = ({ children }) => <span className="infohotkey">{children}</span>;

const RefTable = ({ head, rows }) => (
    <table className="reftable">
        <thead>
            <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
            {rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
        </tbody>
    </table>
);

const TIMEBASES = [
    ['samp', 'a raw sample count', 'sample samps samples'],
    ['sec', 'seconds; #2<sec> is 96000 samples', 'secs second seconds'],
    ['ms', 'milliseconds', 'millis milliseconds'],
    ['b', 'beats at the global tempo', 'beat beats'],
    ['hz', 'one cycle at that frequency; #440<hz> is 109 samples', 'Hz HZ cps'],
    ['nn', 'one cycle at that note\'s pitch; #69<nn> = #440<hz>', 'note'],
    ['ratio', 'relative: 2 is up an octave', ''],
    ['semitones', 'relative: 12 is an octave', 'semitone semi semis'],
    ['cents', 'relative: 100 is a semitone', 'cent'],
];

const TIMEBASE_FACTS = [
    ['sample rate', '48000 per second'],
    ['untagged length', 'read in the default timebase, which starts as beats'],
    ['tempo', 'starts at 120 bpm'],
    ['beats in a wave', 'turned into samples when the wave is made; a tempo change does not change the wave'],
    ['midi note in beats', 'shortened by 5 ms so its note off comes before the next note on'],
    ['saved with a session', 'neither the tempo nor the default timebase'],
];

const TIMEBASE_BUILTINS = [
    ['set-default-timebase', 'sets it from the tags on its argument'],
    ['get-default-timebase', 'reads it'],
    ['set-bpm', 'sets the tempo now'],
    ['queue-bpm', 'sets the tempo on the next downbeat'],
    ['get-bpm', 'reads the tempo'],
    ['duration', 'length in samples, or in the timebase the command is tagged with'],
    ['brightness', 'in hz, or in the timebase the command is tagged with'],
    ['timebase-convert', 'converts to the timebase the command is tagged with'],
    ['resample', 'relative: scales the wave (untagged = ratio); length: resamples to that length, assuming one cycle'],
    ['pitch-shift', 'keeps the length; relative timebases only (untagged = semitones)'],
];

const STYLE_ROWS = ALLOWED.map((name) => [name, STYLE_NOTES[name] || ''])
    .concat([['all', 'only to remove: all:; removes everything']]);

const SURFACE_PATHS = [
    ['((3 4) (238 43) (84 23))', 'a line from point to point'],
    ['(("m" 3 4) ("d" 9 2))', '"m" moves without drawing, "d" draws'],
    ['("fill: #c33" (0 0) (10 0) (5 8))', 'a string first says how to paint the path'],
];

const SURFACE_BUILTINS = [
    ['make-surface', 'an empty surface, width and height in pixels'],
    ['cram', 'draws: puts a path in'],
    ['chop', 'erases: takes a path out'],
    ['mutable', 'shows the paths, to edit'],
    ['immutable', 'shows the picture'],
];

const SURFACE_FACTS = [
    ['coordinates', 'x and y from the top left'],
    ['first point of a path', 'always a move'],
    ['no paint', 'a thin line in the text colour'],
    ['paint properties', SURFACE_PAINT.join(', ')],
    ['values mentioning url', 'ignored'],
    ['a path or point it cannot read', 'skipped, not an error'],
    ['evaluated at the top level', 'becomes immutable'],
];

const ReferencePanel = () => {
    let rows = [];
    for (let midi = 0; midi <= 127; midi++) {
        rows.push(<Row key={midi} midi={midi} />);
    }
    return (
        <div className="infopanel">
            <p className="infotitle">Timebases</p>
            <p className="infoline">Tag a length with a unit: <H>#2&lt;sec&gt;</H></p>
            <RefTable head={['tag', 'means', 'also']} rows={TIMEBASES} />
            <p className="infospacer"></p>
            <RefTable head={['', '']} rows={TIMEBASE_FACTS} />
            <p className="infospacer"></p>
            <RefTable head={['builtin', '']} rows={TIMEBASE_BUILTINS} />
            <p className="infospacer"></p>

            <p className="infotitle">Styles</p>
            <p className="infoline">Properties <H>set-style of</H> allows. Remove one with <H>name:;</H></p>
            <p className="infoline">Per mode: <H>dark {'{'} color: white {'}'} light {'{'} color: black {'}'}</H> or orgs tagged dark and light. No blocks means both.</p>
            <RefTable head={['property', 'notes']} rows={STYLE_ROWS} />
            <p className="infospacer"></p>

            <p className="infotitle">Surfaces</p>
            <RefTable head={['path', 'means']} rows={SURFACE_PATHS} />
            <p className="infospacer"></p>
            <RefTable head={['builtin', '']} rows={SURFACE_BUILTINS} />
            <p className="infospacer"></p>
            <RefTable head={['', '']} rows={SURFACE_FACTS} />
            <p className="infospacer"></p>

            <p className="infotitle">Note numbers</p>
            <p className="infoline">A440 is 69, middle C is 60. <H>midi</H> uses the same numbers, 0 to 127.</p>
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
