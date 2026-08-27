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

// Category names are author-written strings, so make a DOM-safe id out of them.
function categoryId(category) {
    return 'apicat-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const TOP_ID = 'apinav-top';

// The reference is long and the panel isn't its own scroll container, so jumps
// have to go through the document. No smooth behavior -- these are jumps.
function jumpToId(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({block: 'start'});
    }
}

const BackToTop = () => (
    <p className="infoline">
        <span className="apibacktotop" onClick={() => jumpToId(TOP_ID)}>back to top</span>
    </p>
);

const SectionNav = ({groups}) => {
    const jumpTo = (category) => jumpToId(categoryId(category));
    return (
        <div className="apinav" id={TOP_ID}>
            {groups.map((group) => (
                <span
                    key={`nav-${group.category}`}
                    className="apinavitem"
                    onClick={() => jumpTo(group.category)}>{group.category}</span>
            ))}
        </div>
    );
};

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
            {item.aliases.length > 0
                ? (<p className="infoline infoindent">
                        aliases:&nbsp;
                        {item.aliases.map((alias, i) =>
                            <span key={`al${i}`} className="infohotkey">{alias}</span>)}
                   </p>)
                : <></>}
            <InfoLine pieces={item.infoPieces} />
            <p className="infospacer"></p>
            <p className="infospacer"></p>
        </>
    );
};

const ApiReferencePanel = () => {
    const groups = docs();
    return (
        <div className="infopanel" id="fullapireference">
            <SectionNav groups={groups} />
            {groups.map((group) => (
                <div key={group.category}>
                    <p className="infotitle" id={categoryId(group.category)}>{group.category}</p>
                    <BackToTop />
                    <p className="infospacer"></p>
                    {group.items.map((item, i) =>
                        <DocItem key={`${group.category}-${i}`} item={item} />)}
                </div>
            ))}
        </div>
  );
};

export default ApiReferencePanel;
