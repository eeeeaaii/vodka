import React, { useState } from 'react';

const MoreButton = ({onButtonClick}) => {
    return <div
                onClick={onButtonClick}
                className="trymore helpbutton">more...</div>;
}

const TutorialModule = ({content, bottomMenu}) => {
    let [ numThingsToTry, setNumThingsToTry ] = useState(3);

    const displayBodyText = () => {
        let i = 0;
        return content.text.map((line) => <p key={`content${i++}`} className="infolinemargin">{line}</p>);
    }

    const displayThingsToTry = () => {
        let i = 0;
        return <>
            {content.toTry.slice(0, numThingsToTry).map((thing) =>
                <li key={`li${i++}`} className="infolinemargin infolineitalic">
                    {thing}
                </li>)}
            {(numThingsToTry < content.toTry.length)
                ? (<MoreButton onButtonClick={() =>  {
                        setNumThingsToTry(numThingsToTry + 3);
                    }}/>)
                : (<></>)
            }
        </>;
    }

    return (
        <div className="draggablepanel">
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

