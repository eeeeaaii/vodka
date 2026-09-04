import { useState } from 'preact/hooks';

/*
The name box starts as the id, so a session always has something to be listed
under and naming it is a choice rather than a chore.
*/
const NewSessionDialog = ({ sessionId, title, onCreate, onCancel }) => {
    const [name, setName] = useState(sessionId);

    const create = () => onCreate(name.trim() ? name.trim() : sessionId);
    const onKey = (e) => {
        if (e.key == 'Enter') { e.preventDefault(); create(); }
        if (e.key == 'Escape') { e.preventDefault(); onCancel(); }
    };

    return (
        <div className="dialogscrim" onClick={onCancel}>
            <div className="dialogbox" onClick={(e) => e.stopPropagation()}>
                <p className="dialogtitle">{title ? title : 'New session'}</p>
                <input className="dialoginput" type="text" value={name} autoFocus
                    onInput={(e) => setName(e.target.value)} onKeyDown={onKey} />
                <div className="dialogbuttons">
                    <button className="dialogbutton" onClick={create}>create</button>
                    <button className="dialogbutton" onClick={onCancel}>cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewSessionDialog;
