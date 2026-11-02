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
// (comment by Claude)
function categoryId(category) {
    return 'apicat-' + category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const TOP_ID = 'apinav-top';

// The reference is long and the panel isn't its own scroll container, so jumps
// have to go through the document. No smooth behavior -- these are jumps.
// (comment by Claude)
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

/*
Three references: sound, graphics, and the base language, which is everything
else. A category nobody has placed is base, so one added later shows up there
rather than in none of them.
*/
const SOUND_CATEGORIES = [
    'Wavetable Builtins',
    'Midi Builtins',
];

const GRAPHICS_CATEGORIES = [
    'Surface Builtins',
];

/*
The builtins that change how things look are documented as syscalls, along
with the ones that really are syscalls. In the graphics reference they get a
heading of their own, and the base reference leaves them out.
*/
const SYSCALLS = 'Syscalls';
const STYLE = 'Style Builtins';
const STYLE_BUILTINS = [
    'set-style of',
    'get-style of',
    'apply-css-style to',
    'get-css-style-from',
    'apply-pfont to',
    'load-web-font',
    'force-draw',
    'get-pixel-height',
    'get-pixel-width',
];

function isStyleBuiltin(item) {
    return STYLE_BUILTINS.indexOf(item.name) != -1;
}

/*
Arithmetic belongs in both the base and the sound reference. + is a base
builtin and always was; it also takes a wave, and somebody reading the sound
reference to find out what they can do to a wave should not have to already
know that.

So the sound reference carries the arithmetic that accepts a wave -- the same
entries, not a copy of them, filtered to the ones marked as taking one.
*/
const MATH = 'Math Builtins';

function soundGroups(all) {
    let groups = all.filter((group) => SOUND_CATEGORIES.indexOf(group.category) != -1);
    let math = all.find((group) => group.category == MATH);
    if (math) {
        let onWaves = math.items.filter((item) => item.worksOnWaves);
        if (onWaves.length > 0) {
            groups = groups.concat([{ category: MATH, items: onWaves }]);
        }
    }
    return groups;
}

function graphicsGroups(all) {
    let groups = all.filter((group) => GRAPHICS_CATEGORIES.indexOf(group.category) != -1);
    let sys = all.find((group) => group.category == SYSCALLS);
    if (sys) {
        let style = sys.items.filter(isStyleBuiltin);
        if (style.length > 0) {
            groups = [{ category: STYLE, items: style }].concat(groups);
        }
    }
    return groups;
}

function baseGroups(all) {
    return all
        .filter((group) => SOUND_CATEGORIES.indexOf(group.category) == -1
                && GRAPHICS_CATEGORIES.indexOf(group.category) == -1)
        .map((group) => group.category == SYSCALLS
                ? { category: SYSCALLS, items: group.items.filter((item) => !isStyleBuiltin(item)) }
                : group);
}

// kind is 'base', 'sound' or 'graphics'
const ApiReferencePanel = ({kind}) => {
    const all = docs();
    const groups = kind == 'sound' ? soundGroups(all)
            : kind == 'graphics' ? graphicsGroups(all)
            : baseGroups(all);
    return (
        <div className="infopanel" id={kind + 'apireference'}>
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
