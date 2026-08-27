// App.js
import { useState, useEffect } from 'preact/hooks';
import TopMenu from './topmenu.jsx'
import BasicUsagePanel from './basic_usage_panel';
import ApiReferencePanel from './api_reference_panel';
import WelcomePanel from './welcome_panel';
import AccessButton from './access_button';
import StatusNav from './status_nav';
import Tutorial from './tutorial';

import { systemState } from '../systemstate.js';
import {
    endReactTutorial, getInitialHelpState, markVisited,
    HELP_HIDDEN, HELP_OPEN
} from '../help';


import { WELCOME, QUICK_REFERENCE, FULL_API_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

const MINIMIZED = 0;
const SHOWING_PANELS = 1;
const SHOWING_TUTORIAL = 2;
// No panel and no button at all. This is what the test harness gets (via the
// NO_SPLASH experiment) and what users who opted out of the button get.
const HIDDEN = 3;

const WELCOME_PANEL = 0;
const BASIC_USAGE_PANEL = 1;
const API_REFERENCE_PANEL = 2;

function initialUiState() {
    switch (getInitialHelpState()) {
        case HELP_HIDDEN: return HIDDEN;
        case HELP_OPEN: return SHOWING_PANELS;
        default: return MINIMIZED;
    }
}

const App = () => {
    let [ uiState, setUiState ] = useState(initialUiState);
    let [ panel, setPanel ] = useState(WELCOME_PANEL);

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

    const handleMenuChange = (menuChoice) => {
        switch(menuChoice) {
            case WELCOME:
                setPanel(WELCOME_PANEL);
                break;
            case QUICK_REFERENCE:
                setPanel(BASIC_USAGE_PANEL);
                break;
            case FULL_API_REFERENCE:
                setPanel(API_REFERENCE_PANEL);
                break;
            case START_TUTORIAL:
                setUiState(SHOWING_TUTORIAL);
                break;
            case CLOSE_HELP:
                setUiState(MINIMIZED);
                break;
            default:
        }
    }

    // Which tab the top menu should show as selected. The panel constants and
    // the menu constants are separate enumerations, so map explicitly rather
    // than relying on them happening to line up.
    const selectedMenuChoice = () => {
        switch(panel) {
            case API_REFERENCE_PANEL: return FULL_API_REFERENCE;
            case BASIC_USAGE_PANEL:   return QUICK_REFERENCE;
            case WELCOME_PANEL:
            default:                  return WELCOME;
        }
    }

    const displayPanel = () => {
        switch(panel) {
            case API_REFERENCE_PANEL:
                return <ApiReferencePanel/>;
            case BASIC_USAGE_PANEL:
                return <BasicUsagePanel/>;
            case WELCOME_PANEL:
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
            <StatusNav/>
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
                                    selectedMenuChoice={selectedMenuChoice()}
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
