import { frequencyForNoteNum, noteNumForA440 } from '../wavetablefunctions.js';

/*
Two numbering systems meet in vodka and they are twelve apart, which is exactly
the sort of thing you want a table for rather than a paragraph.

A midi note number is what send-midi-note and play-midi take, 0 to 127, and puts
A440 at 69. Vodka's own nn timebase -- the tag you put on a length to say "make
this many samples of that pitch" -- puts A440 at 57. So the same number means
two different pitches depending on which one you are talking to, an octave
apart, and both columns are here so you never have to remember which way round
it goes.

Frequencies come from the engine's own function, so if the reference pitch ever
moves this table moves with it.
*/

const MIDI_A440 = 69;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// the offset between the two, asked rather than assumed
const NN_OFFSET = MIDI_A440 - noteNumForA440();

function noteName(midi) {
    // scientific pitch notation, in which middle C is C4 and is midi 60
    return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

function formatHz(hz) {
    if (hz >= 1000) return hz.toFixed(1);
    if (hz >= 100) return hz.toFixed(2);
    return hz.toFixed(3);
}

// C4, which is the one on the piano you count from and the one nobody can ever
// remember the number of
const MIDDLE_C = 60;

const Row = ({ midi }) => {
    let nn = midi - NN_OFFSET;
    let hz = frequencyForNoteNum(nn);
    let middle = (midi == MIDDLE_C);
    return (
        <tr className={middle ? 'noterefmiddle' : ''}>
            <td className="noterefname">{noteName(midi)}</td>
            <td className="noterefnum">{midi}</td>
            <td className="noterefnum">{nn}</td>
            <td className="noterefhz">{formatHz(hz)}</td>
            <td className="noterefnote">{middle ? 'middle C' : ''}</td>
        </tr>
    );
};

const NoteReferencePanel = () => {
    let rows = [];
    for (let midi = 0; midi <= 127; midi++) {
        rows.push(<Row key={midi} midi={midi} />);
    }
    return (
        <div className="infopanel">
            <p className="infotitle">Note Numbers</p>

            <p className="infolinemargin">
                <span className="infohotkey">midi</span>is the number
                <span className="infohotkey">send-midi-note</span>and
                <span className="infohotkey">play-midi</span>take, 0 to 127.
            </p>
            <p className="infolinemargin">
                <span className="infohotkey">nn</span>is vodka's own note
                timebase -- the tag you put on a length, as in
                <span className="infohotkey">#57&lt;nn&gt;</span>-- and it sits
                an octave below the midi number for the same pitch. A440 is midi
                69 and nn 57.
            </p>
            <p className="infospacer"></p>

            <table className="noteref">
                <thead>
                    <tr>
                        <th>note</th>
                        <th>midi</th>
                        <th>nn</th>
                        <th>Hz</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
};

export default NoteReferencePanel;
