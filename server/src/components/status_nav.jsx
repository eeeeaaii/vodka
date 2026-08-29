import { useState, useEffect } from 'preact/hooks';
import { isAnySoundPlaying, stopAllSound } from '../webaudio.js';
import { hasPendingSave } from '../autosave.js';

// Neither playback nor the save debounce announces itself, so poll. Cheap --
// two boolean reads.
const POLL_MS = 250;

const StatusNav = () => {
    const [playing, setPlaying] = useState(false);
    const [unsaved, setUnsaved] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            setPlaying(isAnySoundPlaying());
            setUnsaved(hasPendingSave());
        }, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="statusnav">
            {unsaved && <div className="unsaveddot" title="not saved yet"></div>}
            {playing &&
                <div className="statusnavitem stopbutton" title="stop all sound"
                     onClick={() => { stopAllSound(); setPlaying(false); }}>
                    <span className="stopbar"></span>
                    <span className="stopbar"></span>
                </div>}
        </div>
    );
};

export default StatusNav;
