import { frequencyForNoteNum } from '../wavetablefunctions.js';

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
                <span className="infohotkey">nn</span>is the same number, used as
                a timebase -- the tag you put on a length, as in
                <span className="infohotkey">#69&lt;nn&gt;</span>for A440. It used
                to sit an octave below midi; documents saved before that changed
                sound an octave low until twelve is added to their note numbers.
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

export default NoteReferencePanel;
