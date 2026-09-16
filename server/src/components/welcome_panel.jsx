import { useState } from 'preact/hooks';
import { systemState } from '../systemstate.js';
import { buildURL } from '../help';
import NewSessionDialog from './new_session_dialog';
import {
    listSessions,
    newSessionId,
    setName,
    exportCurrentSession,
    fileNameForCurrentSession,
    parseSessionFile,
    importSession,
    duplicateCurrentSession,
    saveTextToFile,
    readTextFromFile,
} from '../sessionmanager.js';

const WelcomePanel = () => {
    const sessionId = systemState.getSessionId();
    const oppositeTheme = (window.CSS_THEME == 'dark' ? 'light' : 'dark');

    // {title, id} while a name is being asked for, null the rest of the time
    const [dialog, setDialog] = useState(null);
    const [message, setMessage] = useState(null);
    const sessions = listSessions();

    const goTo = (id) => { window.location.href = buildURL({ 'sessionId': id }); };

    const askForNewSession = (e) => {
        e.preventDefault();
        setDialog({ title: 'New session', id: newSessionId(), kind: 'new' });
    };

    const askForDuplicate = (e) => {
        e.preventDefault();
        setDialog({ title: 'Duplicate session', id: newSessionId(), kind: 'duplicate' });
    };

    const onCreate = (name) => {
        let d = dialog;
        setDialog(null);
        if (d.kind == 'duplicate') {
            duplicateCurrentSession(name).then(goTo);
            return;
        }
        setName(d.id, name);
        goTo(d.id);
    };

    const doExport = (e) => {
        e.preventDefault();
        let text = JSON.stringify(exportCurrentSession(), null, 1);
        saveTextToFile(text, fileNameForCurrentSession());
    };

    const doImport = (e) => {
        e.preventDefault();
        readTextFromFile().then((text) => {
            if (!text) return;
            let r = parseSessionFile(text);
            if (r.error) { setMessage(r.error); return; }
            importSession(r.session).then(goTo);
        });
    };

    return (
        <div className="infopanel">
            <p className="infotitle">Vodka</p>
            <p className="infosubheader">Release 0.5</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is a creative coding environment for music and text.</p>
            <p className="infospacer"></p>
            <p className="infoline">More info about Vodka can be found at:</p>
            <p className="infoline"><a href="https://github.com/eeeeaaii/vodka">Github</a></p>
            <p className="infospacer"></p>
            <p className="infoline">There are also help pages and a tutorial/walkthrough accessible by the links above.</p>
            <p className="infospacer"></p>
            <p className="infoline">The current session ID is <span id="sessionid">{sessionId}</span>.</p>
            <p className="infoline">Other sessions available on this machine:</p>
            <ul className="sessionlist">
                {sessions.filter((s) => !s.isCurrent).map((s) => (
                    <li key={s.id}><a href={buildURL({ 'sessionId': s.id })}>{s.name}</a></li>
                ))}
                {sessions.filter((s) => !s.isCurrent).length == 0 &&
                    <li className="sessionlistempty">none yet</li>}
            </ul>
            <p className="infoline">Your session is scoped only to this browser and will be gone if you delete local data,
                change computers, change browsers,
                etc. To export this session to a file that you can import to another browser, <a href="#" onClick={doExport}>click here</a>.
                To import a session you saved to a file previously, <a href="#" onClick={doImport}>click here</a>.
                Bookmark <a id="sessionlink" href={buildURL({ "sessionId": sessionId })}>this link</a>
                &nbsp;to come directly back to this session.</p>
            {message && <p className="infoline sessionmessage">{message}</p>}
            <p className="infoline">
                To create a new session, <a href="#" onClick={askForNewSession}>click here</a>. To make a duplicate of this session, <a href="#" onClick={askForDuplicate}>click here</a>. Saving and loading files is disabled
                on the web. If you clone the vodka repo and run a local server, you can save files
                within your session.</p>
            <p className="infoline">To switch to {oppositeTheme} theme, click <a id="switchthemelink" href={buildURL({ "theme": oppositeTheme })}>here</a>.</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is in beta and is a part-time side project.
                I will <b>do my best</b> to make sure your session data is preserved across product
                updates, but there are no guarantees.</p>
            <p className="infospacer"></p>
            <p className="infoline">Vodka is created by <a href="https://instagram.com/eeeeaaii">Jason Scherer (eeeeaaii)</a></p>
            <p className="infoline">You retain all copyright to any creative works you make with Vodka.</p>
            <p className="infoline">Changes to the Vodka framework itself are protected by <a href="https://www.gnu.org/licenses/">the GPL</a>.</p>
            <p className="infoline">If you have questions or want to report a problem, feel free to file an issue on github and assign it to me.</p>
            <p className="infospacer"></p>
            {dialog && <NewSessionDialog sessionId={dialog.id} title={dialog.title}
                onCreate={onCreate} onCancel={() => setDialog(null)} />}
        </div>
    );
};

export default WelcomePanel;
