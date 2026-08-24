import { useState, useEffect, useRef } from 'preact/hooks';

// Where the panel was left. Module-level so that dragging it somewhere and
// then paging forward/back doesn't send it home again -- this matches the old
// non-React version, which kept left/top in file scope.
let panelLeft = 200;
let panelTop = 50;

const MoreButton = ({onButtonClick}) => {
    return <div
                onClick={onButtonClick}
                className="trymore helpbutton">more...</div>;
}

// Click and drag anywhere on the panel to move it, except on the buttons.
// The move/up handlers go on window rather than the panel itself so that a
// fast drag doesn't get dropped when the pointer outruns the element.
function useDraggable() {
    const ref = useRef(null);
    const [ pos, setPos ] = useState({ left: panelLeft, top: panelTop });
    const drag = useRef(null);

    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current) return;
            panelLeft += e.clientX - drag.current.x;
            panelTop += e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            setPos({ left: panelLeft, top: panelTop });
        };
        const onUp = () => { drag.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    const onMouseDown = (e) => {
        // let the buttons be buttons
        if (e.target.classList && e.target.classList.contains('helpbutton')) {
            return;
        }
        drag.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    };

    return { ref, onMouseDown, style: { left: `${pos.left}px`, top: `${pos.top}px` } };
}

const TutorialModule = ({content, bottomMenu}) => {
    let [ numThingsToTry, setNumThingsToTry ] = useState(3);
    const draggable = useDraggable();

    // a new page means a fresh set of things to try
    useEffect(() => {
        setNumThingsToTry(3);
    }, [content]);

    const displayBodyText = () => {
        let i = 0;
        return content.text.map((line) => <p key={`content${i++}`} className="infolinemargin">{line}</p>);
    }

    const displayThingsToTry = () => {
        let i = 0;
        return <>
            <ul>
                {content.toTry.slice(0, numThingsToTry).map((thing) =>
                    <li key={`li${i++}`} className="infolinemargin infolineitalic">
                        {thing}
                    </li>)}
            </ul>
            {(numThingsToTry < content.toTry.length)
                ? (<MoreButton onButtonClick={() =>  {
                        setNumThingsToTry(numThingsToTry + 3);
                    }}/>)
                : (<></>)
            }
        </>;
    }

    return (
        <div className="draggablepanel"
             ref={draggable.ref}
             style={draggable.style}
             onMouseDown={draggable.onMouseDown}>
        <div className="infopanel">
            <p id="tutorialtitle" className="infotitle">{content.title}</p>
            <div id="tutorialcontent">
                {displayBodyText()}
            </div>
            <p className="infospacer"></p>
            <div id="infothingstotry">
                <p className="infoline">Things to try:</p>
                <div id="tryset">
                    {displayThingsToTry()}
                </div>
            </div>
            <p className="infospacer"></p>
            <p className="infoline">(click and drag to move this panel)</p>
        </div>
        {bottomMenu}
        </div>
    );
}

export default TutorialModule;
