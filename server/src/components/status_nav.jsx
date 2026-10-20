import { useState, useEffect, useRef } from 'preact/hooks';
import { isAnySoundPlaying, stopAllSound, anyLoopsPlaying, anythingIsRecording, stopAllRecording } from '../webaudio.js';
import { anyMidiNotesSounding, midiPanic } from '../midifunctions.js';
import { stopAllLoops, anyLoopsRunning } from '../builtins/asyncbuiltins.js';
import { hasPendingSave } from '../autosave.js';
import { getBpm } from '../wavetablefunctions.js';
import { undoDistancePercent } from '../actions.js';
import { outputIsClipping } from '../audiodevices.js';
import { onPlaybackFrame } from '../playbackloop.js';
import { toggleTopPanel, isTopPanelOpen, restoreTopPanel } from '../toppanel.js';

// how long the clip light stays on after the last sample over full scale, so a
// single click is still something you can see
// (comment by Claude)
const CLIP_HOLD_MS = 300;

// None of what this shows announces itself, so poll. Cheap -- two boolean reads
// and a number.
const POLL_MS = 250;

const StatusNav = () => {
    const [playing, setPlaying] = useState(false);
    const [unsaved, setUnsaved] = useState(false);
    // set-bpm is a builtin, so this changes from inside the document with
    // nothing to tell the ui about it
    const [bpm, setDisplayedBpm] = useState(getBpm());
    // how full the ctrl-shift-s context is; null outside one
    // (comment by Claude)
    const [undoPercent, setUndoPercent] = useState(undoDistancePercent());
    const clipLight = useRef(null);
    const [panelOpen, setPanelOpen] = useState(() => {
        restoreTopPanel();
        return isTopPanelOpen();
    });

    /*
    The clip light is set straight on its element every frame rather than
    through state: the poll above is a quarter of a second, which is long
    enough to miss a click entirely, and rendering the bar sixty times a
    second to change one class is not worth it.

    (comment by Claude)
    */
    useEffect(() => {
        let lastClip = -Infinity;
        let lit = false;
        return onPlaybackFrame((now) => {
            // nothing can clip while nothing is sounding, and checking sixteen
            // channels sixty times a second for nothing adds up
            // (comment by Claude)
            if ((isAnySoundPlaying() || anythingIsRecording()) && outputIsClipping()) {
                lastClip = now;
            }
            let on = now - lastClip < CLIP_HOLD_MS;
            if (on != lit && clipLight.current) {
                clipLight.current.classList.toggle('clipping', on);
                lit = on;
            }
        });
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            // a midi note left sounding is the same kind of problem as audio
            // still running, and more urgent -- nothing stops it on its own
            // (comment by Claude)
            // a take counts as something going on: it is holding the
            // microphone open and filling a wave, so there has to be a stop
            // button while one is running even if nothing is making a sound
            // (comment by Claude)
            setPlaying(isAnySoundPlaying() || anyMidiNotesSounding() || anyLoopsRunning()
                    || anyLoopsPlaying() || anythingIsRecording());
            setUnsaved(hasPendingSave());
            setDisplayedBpm(getBpm());
            setUndoPercent(undoDistancePercent());
        }, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="statusnav">
            {/* dot, then the stop button, then the tempo -- the two that come
                and go are on the left, so the number does not move when they
                appear */}
            {unsaved &&
                <div className="statusnavitem" title="not saved yet">
                    <div className="unsaveddot"></div>
                </div>}
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
                         stopAllRecording();
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
            <div className="statusnavitem cliplight" ref={clipLight}
                 title="red while the output is louder than full scale"></div>
            {undoPercent !== null &&
                <div className="statusnavitem undoreadout"
                     title="how full the save point's undo buffer is (ctrl-shift-r restores, ctrl-shift-f keeps)">
                    U{undoPercent}%
                </div>}
            <div className="statusnavitem panelcaret" title="show what is playing"
                 onClick={() => {
                     toggleTopPanel();
                     setPanelOpen(isTopPanelOpen());
                 }}>
                {panelOpen ? '\u25b4' : '\u25be'}
            </div>
        </div>
    );
};

export default StatusNav;
