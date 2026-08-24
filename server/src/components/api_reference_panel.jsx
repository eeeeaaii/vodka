import { getDocs } from '../documentation.js';

// The docs are collected when the builtins are created, which has already
// happened by the time this island mounts, so reading them at render time is
// fine -- but they never change, so don't recompute on every render.
let cachedDocs = null;
function docs() {
    if (cachedDocs === null) {
        cachedDocs = getDocs();
    }
    return cachedDocs;
}

const InfoLine = ({pieces}) => {
    return (
        <p className="infoline infoindent">
            {pieces.map((piece, i) => piece.isHotkey
                ? <span key={`p${i}`} className="infohotkey">{piece.text}</span>
                : <span key={`p${i}`}>{piece.text}</span>)}
        </p>
    );
};

const DocItem = ({item}) => {
    return (
        <>
            <p className="infoline">
                <span className="infohotkey infohotkeylarge">{item.name}</span>
            </p>
            {item.params.length > 0
                ? (<p className="infoline infoindent">
                        args:&nbsp;
                        {item.params.map((param, i) =>
                            <span key={`a${i}`} className="infohotkey">{param}</span>)}
                   </p>)
                : <></>}
            <InfoLine pieces={item.infoPieces} />
            <p className="infospacer"></p>
            <p className="infospacer"></p>
        </>
    );
};

const ApiReferencePanel = () => {
    return (
        <div className="infopanel" id="fullapireference">
            {docs().map((group) => (
                <div key={group.category}>
                    <p className="infotitle">{group.category}</p>
                    <p className="infospacer"></p>
                    {group.items.map((item, i) =>
                        <DocItem key={`${group.category}-${i}`} item={item} />)}
                </div>
            ))}
        </div>
  );
};

export default ApiReferencePanel;
