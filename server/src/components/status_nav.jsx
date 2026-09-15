import { useState, useEffect } from 'preact/hooks';
import { isAnySoundPlaying, stopAllSound, anyLoopsPlaying } from '../webaudio.js';
import { anyMidiNotesSounding, midiPanic } from '../midifunctions.js';
import { stopAllLoops, anyLoopsRunning } from '../builtins/asyncbuiltins.js';
import { hasPendingSave } from '../autosave.js';

// Neither playback nor the save debounce announces itself, so poll. Cheap --
// two boolean reads.
const POLL_MS = 250;

const StatusNav = () => {
    const [playing, setPlaying] = useState(false);
    const [unsaved, setUnsaved] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            // a midi note left sounding is the same kind of problem as audio
            // still running, and more urgent -- nothing stops it on its own
            setPlaying(isAnySoundPlaying() || anyMidiNotesSounding() || anyLoopsRunning() || anyLoopsPlaying());
            setUnsaved(hasPendingSave());
        }, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="statusnav">
            {unsaved && <div className="unsaveddot" title="not saved yet"></div>}
            {playing &&
                <div className="statusnavitem stopbutton" title="stop everything"
                     onClick={() => { stopAllSound(); midiPanic(); stopAllLoops(); setPlaying(false); }}>
                    {/* currentColor so the icon follows the theme token on the parent */}
                    <svg viewBox="0 0 8 9" width="8" height="9" aria-hidden="true">
                        <rect x="0" y="0" width="3" height="9" fill="currentColor"/>
                        <rect x="5" y="0" width="3" height="9" fill="currentColor"/>
                    </svg>
                </div>}
        </div>
    );
};

export default StatusNav;
