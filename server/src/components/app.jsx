// App.js
import { useState, useEffect } from 'preact/hooks';
import TopMenu from './topmenu.jsx'
import BasicUsagePanel from './basic_usage_panel';
import ApiReferencePanel from './api_reference_panel';
import AbstractDataTypesPanel from './abstract_data_types_panel';
import WelcomePanel from './welcome_panel';
import AccessButton from './access_button';
import StatusNav from './status_nav';
import Tutorial from './tutorial';
import ReferencePanel from './reference_panel';
import { takeJustCreated } from '../sessionmanager.js';

import { systemState } from '../systemstate.js';
import {
    endReactTutorial, getInitialHelpState, markVisited,
    HELP_HIDDEN, HELP_OPEN
} from '../help';


import { WELCOME, QUICK_REFERENCE, ABSTRACT_DATA_TYPES, BASE_API, SOUND_API, GRAPHICS_API, API_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

const MINIMIZED = 0;
const SHOWING_PANELS = 1;
const SHOWING_TUTORIAL = 2;
// No panel and no button at all. This is what the test harness gets (via the
// NO_SPLASH experiment) and what users who opted out of the button get.
const HIDDEN = 3;

function initialUiState() {
    switch (getInitialHelpState()) {
        case HELP_HIDDEN: return HIDDEN;
        case HELP_OPEN: return SHOWING_PANELS;
        default: return MINIMIZED;
    }
}

const App = () => {
    let [ uiState, setUiState ] = useState(initialUiState);
    // which tab is showing -- one of the menu constants
    let [ panel, setPanel ] = useState(WELCOME);

    // While the help panel is up, keystrokes belong to the panel, not to the
    // editor underneath it -- otherwise typing scrolls/inserts nexes behind
    // the panel. The tutorial is the exception: the whole point of it is that
    // you keep driving the editor while it's open.
    useEffect(() => {
        systemState.setKeyFunnelActive(uiState != SHOWING_PANELS);
    }, [uiState]);

    useEffect(() => {
        markVisited();
    }, []);

    // the session this page was opened to show, if it was made a moment ago
    // in the session list on the welcome tab -- see markJustCreated
    // (comment by Claude)
    let [ justCreated, setJustCreated ] = useState(takeJustCreated);

    const handleMenuChange = (menuChoice) => {
        switch(menuChoice) {
            case START_TUTORIAL:
                setUiState(SHOWING_TUTORIAL);
                break;
            case CLOSE_HELP:
                setUiState(MINIMIZED);
                break;
            default:
                setPanel(menuChoice);
        }
    }

    const displayPanel = () => {
        switch(panel) {
            case QUICK_REFERENCE:
                return <BasicUsagePanel/>;
            case BASE_API:
                return <ApiReferencePanel kind="base"/>;
            case SOUND_API:
                return <ApiReferencePanel kind="sound"/>;
            case GRAPHICS_API:
                return <ApiReferencePanel kind="graphics"/>;
            case API_REFERENCE:
                return <ReferencePanel/>;
            case ABSTRACT_DATA_TYPES:
                return <AbstractDataTypesPanel/>;
            case WELCOME:
            default:
                return <WelcomePanel/>;
        }
    }

    const handleEndTutorial = () => {
        endReactTutorial();
        setUiState(SHOWING_PANELS);
    }

    return (
        <div>
            {/* HIDDEN means no help chrome at all -- what the test harness gets
                via NO_SPLASH, and what someone who turned the button off asked
                for. The status nav is help chrome too, and a dot that appears
                in every screenshot is a dot in every golden. */}
            {/* (comment by Claude) */}
            {uiState != HIDDEN && <StatusNav/>}
            {justCreated &&
                <div className="dialogscrim" onClick={() => setJustCreated(null)}>
                    <div className="dialogbox" onClick={(e) => e.stopPropagation()}>
                        <p className="dialogtitle">Session created</p>
                        <p>You are now in <b>{justCreated}</b>.</p>
                        <div className="dialogbuttons">
                            <button className="dialogbutton" autoFocus
                                onClick={() => setJustCreated(null)}>ok</button>
                        </div>
                    </div>
                </div>}
            {
                (() => {
                    switch(uiState) {
                        case HIDDEN:
                            return <></>;
                        case MINIMIZED:
                            return (
                            <AccessButton text="Help" onButtonClick={() => {
                                setUiState(SHOWING_PANELS);
                            }}/>
                            );
                        case SHOWING_PANELS:
                            return (
                                <>
                                <TopMenu
                                    selectedMenuChoice={panel}
                                    onMenuChange={handleMenuChange}/>
                                {displayPanel()}
                                </>
                            );
                        case SHOWING_TUTORIAL:
                            return (
                                <>
                                <AccessButton text="Exit Tutorial" onButtonClick={handleEndTutorial} />
                                <Tutorial onEndTutorial={handleEndTutorial} />
                                </>
                            );
        
                    }
                })()
            }
        </div>
    );
};

export default App;
