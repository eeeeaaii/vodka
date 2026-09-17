import { useState, useEffect } from 'preact/hooks';
import { isAnySoundPlaying, stopAllSound, anyLoopsPlaying } from '../webaudio.js';
import { anyMidiNotesSounding, midiPanic } from '../midifunctions.js';
import { stopAllLoops, anyLoopsRunning } from '../builtins/asyncbuiltins.js';
import { hasPendingSave } from '../autosave.js';
import { getBpm } from '../wavetablefunctions.js';

// None of what this shows announces itself, so poll. Cheap -- two boolean reads
// and a number.
const POLL_MS = 250;

const StatusNav = () => {
    const [playing, setPlaying] = useState(false);
    const [unsaved, setUnsaved] = useState(false);
    // set-bpm is a builtin, so this changes from inside the document with
    // nothing to tell the ui about it
    const [bpm, setDisplayedBpm] = useState(getBpm());

    useEffect(() => {
        const id = setInterval(() => {
            // a midi note left sounding is the same kind of problem as audio
            // still running, and more urgent -- nothing stops it on its own
            // (comment by Claude)
            setPlaying(isAnySoundPlaying() || anyMidiNotesSounding() || anyLoopsRunning() || anyLoopsPlaying());
            setUnsaved(hasPendingSave());
            setDisplayedBpm(getBpm());
        }, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="statusnav">
            {/* dot, then the stop button, then the tempo -- the two that come
                and go are on the left, so the number does not move when they
                appear */}
            {unsaved && <div className="unsaveddot" title="not saved yet"></div>}
            {playing &&
                <div className="statusnavitem stopbutton" title="stop everything"
                     onClick={() => {
                         // midi first: it throws away messages the browser has
                         // already been handed, and those are the ones that
                         // would otherwise keep sounding after everything else
                         // has stopped
                         // (comment by Claude)
                         midiPanic();
                         stopAllSound();
                         stopAllLoops();
                         setPlaying(false);
                     }}>
                    {/* currentColor so the icon follows the theme token on the parent */}
                    {/* (comment by Claude) */}
                    <svg viewBox="0 0 8 9" width="8" height="9" aria-hidden="true">
                        <rect x="0" y="0" width="3" height="9" fill="currentColor"/>
                        <rect x="5" y="0" width="3" height="9" fill="currentColor"/>
                    </svg>
                </div>}
            <div className="statusnavitem bpmreadout" title="beats per minute">{bpm}</div>
        </div>
    );
};

export default StatusNav;
