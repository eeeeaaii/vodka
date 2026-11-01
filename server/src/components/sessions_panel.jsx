import { useState, useEffect } from 'preact/hooks';
import { systemState } from '../systemstate.js';
import { buildURL } from '../help';
import { canSave, defaultSessionId } from '../deployment.js';
import NewSessionDialog from './new_session_dialog';
import {
    listSessions,
    newSessionId,
    nameOf,
    setName,
    exportCurrentSession,
    fileNameForCurrentSession,
    parseSessionFile,
    importSession,
    copySessionData,
    moveSessionData,
    deleteSessionData,
    browserBytesOf,
    listSessionFolders,
    sessionFolderOp,
    saveTextToFile,
    readTextFromFile,
} from '../sessionmanager.js';

/*
Every session there is, and what you can do to each one.

On a server you run yourself a session is a folder in your sessions directory
as well as whatever the browser keeps for it, and the folder name is the
session's name -- so renaming one renames the folder, and everything the
browser holds is moved along with it. On the web there are no folders: a
session is only what this browser holds, and its name is a label on an id.

(comment by Claude)
*/

const RESERVED = ['packages', 'samples'];

function formatBytes(n) {
    if (n == null) return '...';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function isUsableName(name) {
    return /^[a-zA-Z0-9_-]+$/.test(name) && RESERVED.indexOf(name) == -1;
}

const SessionsPanel = () => {
    const local = canSave();
    const currentId = systemState.getSessionId();
    const defaultId = defaultSessionId();
    const inDefault = (currentId == defaultId);

    // [{id, name, disk}] -- disk is bytes on disk, or null on the web
    const [rows, setRows] = useState([]);
    // id -> bytes in browser storage, filled in as each one is counted
    const [browserSizes, setBrowserSizes] = useState({});
    // {kind, id, title, button} while a name is being asked for
    const [dialog, setDialog] = useState(null);
    // {kind, id} while waiting for a yes
    const [confirming, setConfirming] = useState(null);
    const [message, setMessage] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);

    const refresh = () => setRefreshCount(refreshCount + 1);

    useEffect(() => {
        let cancelled = false;
        listSessionFolders().then((folders) => {
            if (cancelled) return;
            let byId = {};
            // the browser's own list, with its pages folded into their session
            listSessions().forEach((s) => {
                if (!byId[s.id]) byId[s.id] = { id: s.id, name: nameOf(s.id), disk: null };
            });
            folders.forEach((f) => {
                if (!byId[f.id]) byId[f.id] = { id: f.id, name: f.id, disk: null };
                byId[f.id].disk = f.bytes;
            });
            if (!byId[defaultId]) byId[defaultId] = { id: defaultId, name: defaultId, disk: null };
            let list = Object.values(byId);
            // on a local server a session with no folder cannot be opened, so it is
            // only the browser's leftovers -- still listed, so it can be deleted
            list.sort((a, b) => {
                if (a.id == defaultId) return -1;
                if (b.id == defaultId) return 1;
                return a.name.localeCompare(b.name);
            });
            setRows(list);
            list.forEach((r) => {
                browserBytesOf(r.id).then((n) => {
                    if (cancelled) return;
                    setBrowserSizes((prev) => Object.assign({}, prev, { [r.id]: n }));
                });
            });
        });
        return () => { cancelled = true; };
    }, [refreshCount]);

    const goTo = (id) => { window.location.href = buildURL({ 'sessionId': id, 'page': null }); };

    const failed = (r) => {
        if (r && r.ok) return false;
        setMessage(r && r.error ? r.error : 'that did not work.');
        return true;
    };

    const ask = (kind, id, title, button, initial) => (e) => {
        e.preventDefault();
        setMessage(null);
        setDialog({ kind: kind, id: id, title: title, button: button, initial: initial });
    };

    const askToConfirm = (kind, id) => (e) => {
        e.preventDefault();
        setMessage(null);
        setConfirming({ kind: kind, id: id });
    };

    // what a new name becomes: the folder name on a local server, a label on a
    // fresh id on the web
    const newIdFor = (name) => local ? name : newSessionId();

    const onName = (rawName) => {
        let d = dialog;
        setDialog(null);
        let name = rawName.trim();
        if (!name) return;
        if (local && !isUsableName(name)) {
            setMessage(`"${name}" will not do as a session name -- letters, digits, _ and - only, and not packages or samples.`);
            return;
        }
        let to = newIdFor(name);
        if (d.kind == 'new') {
            sessionFolderOp('create', to).then((r) => {
                if (failed(r)) return;
                if (!local) setName(to, name);
                goTo(to);
            });
        } else if (d.kind == 'duplicate') {
            sessionFolderOp('duplicate', d.id, to).then((r) => {
                if (failed(r)) return;
                return copySessionData(d.id, to, local ? null : name).then(() => {
                    setMessage(`made ${name}, a copy of ${nameOf(d.id)}.`);
                    refresh();
                });
            });
        } else if (d.kind == 'rename') {
            if (!local) {
                setName(d.id, name);
                refresh();
                return;
            }
            sessionFolderOp('rename', d.id, to).then((r) => {
                if (failed(r)) return;
                return moveSessionData(d.id, to).then(() => {
                    if (d.id == currentId) {
                        goTo(to);
                    } else {
                        refresh();
                    }
                });
            });
        } else if (d.kind == 'saveas') {
            /*
            The work goes to the new session, and you go with it -- it is the
            same piece under a name now -- and the default is left empty for the
            next sketch. Locally the server renames the folder and makes a new
            empty default in its place, so nothing is copied twice.
            */
            let op = local ? 'rename' : 'create';
            sessionFolderOp(op, d.id, to).then((r) => {
                if (failed(r)) return;
                return moveSessionData(d.id, to, local ? null : name).then(() => goTo(to));
            });
        }
    };

    const onConfirm = (e) => {
        e.preventDefault();
        let c = confirming;
        setConfirming(null);
        setMessage(c.kind == 'clear' ? 'Clearing the default session...' : `Deleting ${nameOf(c.id)}...`);
        // the default always exists, so deleting it is emptying it, and
        // the server makes a new empty folder in its place
        sessionFolderOp('delete', c.id).then((r) => {
            if (failed(r)) return;
            return deleteSessionData(c.id).then(() => {
                if (c.id == currentId) {
                    // what is on screen was built from what was just deleted
                    goTo(defaultId);
                } else {
                    setMessage(null);
                    refresh();
                }
            });
        });
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
            importSession(r.session).then((id) => {
                // a local server only opens sessions that have a folder
                return sessionFolderOp('create', id).then(() => goTo(id));
            });
        });
    };

    const action = (label, onClick, className) => (
        <a href="#" className={'sessionaction' + (className ? ' ' + className : '')} onClick={onClick}>{label}</a>
    );

    return (
        <div className="infopanel">
            <p className="infoheading">Sessions</p>
            <p className="infospacer"></p>
            <p className="infoline">
                {local
                    ? <>Each session is a folder in your sessions directory, which is gitignored, so you can clone your own git repo into it to keep your work. A page with no session in its address opens <b>{defaultId}</b>.</>
                    : <>Your sessions live only in this browser, and are gone if you clear its data. Export one to a file to keep it or move it to another browser. A page with no session in its address opens <b>{defaultId}</b>.</>}
            </p>
            <p className="infospacer"></p>
            <p className="infoline sessiontopactions">
                {action('new session', ask('new', null, 'New session', 'create', ''))}
                {action('import from file', doImport)}
                {inDefault && action('save this session as...', ask('saveas', currentId, 'Save this session as', 'save', ''))}
                {inDefault && action('clear the default session', askToConfirm('clear', currentId))}
            </p>
            {message && <p className="infoline sessionmessage">{message}</p>}
            {confirming &&
                <p className="infoline sessiondeleteconfirm">
                    {confirming.kind == 'clear'
                        ? <>Really empty <b>{defaultId}</b>? Its document, audio{local ? ' and files' : ''} will be gone.</>
                        : <>Really delete <b>{nameOf(confirming.id)}</b>? Its document, audio{local ? ' and its folder of files' : ''} will be gone, and this cannot be undone.</>}
                    &nbsp;{action('yes', onConfirm)}
                    &nbsp;/&nbsp;{action('cancel', (e) => { e.preventDefault(); setConfirming(null); })}
                </p>}
            <p className="infospacer"></p>
            <table className="sessiontable">
                <thead>
                    <tr>
                        <th>session</th>
                        <th>in browser</th>
                        {local && <th>on disk</th>}
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        let isCurrent = (r.id == currentId);
                        let isDefault = (r.id == defaultId);
                        return (
                            <tr key={r.id} className={isCurrent ? 'sessioncurrent' : ''}>
                                <td>
                                    {isCurrent
                                        ? <b>{r.name}</b>
                                        : <a href={buildURL({ 'sessionId': r.id, 'page': null })}>{r.name}</a>}
                                    {r.name != r.id && <span className="sessionid"> {r.id}</span>}
                                    {isCurrent && <span className="sessionid"> (open)</span>}
                                </td>
                                <td>{formatBytes(browserSizes[r.id])}</td>
                                {local && <td>{r.disk == null ? 'no folder' : formatBytes(r.disk)}</td>}
                                <td className="sessionactions">
                                    {!isDefault && action('rename', ask('rename', r.id, 'Rename ' + r.name, 'rename', r.name))}
                                    {action('duplicate', ask('duplicate', r.id, 'Duplicate ' + r.name, 'duplicate', r.name + '-copy'))}
                                    {isCurrent && action('export', doExport)}
                                    {!isDefault && action('delete', askToConfirm('delete', r.id))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="infospacer"></p>
            <p className="infoline">Bookmark <a href={buildURL({ "sessionId": currentId })}>this link</a> to come straight back to this session.</p>
            {dialog && <NewSessionDialog
                sessionId={dialog.initial}
                title={dialog.title} buttonText={dialog.button}
                onCreate={onName} onCancel={() => setDialog(null)} />}
        </div>
    );
};

export default SessionsPanel;
