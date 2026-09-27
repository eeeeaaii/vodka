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
            <p className="infotitle">Timebases</p>

            <p className="infolinemargin">
                Sound is measured in samples, 48000 to the second. Every length
                a sound builtin takes becomes a number of samples. The number
                can be tagged with a unit; the tag is the unit. There are five:
            </p>
            <p className="infospacer"></p>
            <p className="infoline"><span className="infohotkey">samp</span>a raw sample count. Also <span className="infohotkey">samps</span><span className="infohotkey">samples</span></p>
            <p className="infoline"><span className="infohotkey">sec</span>seconds. <span className="infohotkey">#2&lt;sec&gt;</span>is 96000 samples. Also <span className="infohotkey">secs</span><span className="infohotkey">second</span><span className="infohotkey">seconds</span></p>
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
                <span className="infohotkey">play-with-bpm</span>changes it on
                the downbeat of the loop it starts;
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
                one timebase; click it to cycle through the five.
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Special timebases</p>
            <p className="infolinemargin">
                <span className="infohotkey">cents</span>and
                <span className="infohotkey">semitones</span>are intervals, not
                lengths: they move a pitch by a ratio rather than naming a
                duration. 100 cents is a semitone; 1200 cents, or 12 semitones,
                is an octave, a doubling.
            </p>
            <p className="infolinemargin">
                Two builtins read them, on their amount arguments.
                <span className="infohotkey">pitch-shift</span>reads an
                untagged amount as semitones;
                <span className="infohotkey">resample-by</span>reads one as a
                rate. Elsewhere they mean nothing. Also
                <span className="infohotkey">cent</span>
                <span className="infohotkey">semitone</span>
                <span className="infohotkey">semi</span>
                <span className="infohotkey">semis</span>
            </p>
            <p className="infospacer"></p>

            <p className="infosubheader">Note numbers</p>
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

export default NoteReferencePanel;
