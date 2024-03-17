// App.js
import React, { useState } from 'react';
import TopMenu from './topmenu.jsx'
import BasicUsagePanel from './basic_usage_panel';
import ApiReferencePanel from './api_reference_panel';
import WelcomePanel from './welcome_panel';
import AccessButton from './access_button';
import Tutorial from './tutorial';

import { endReactTutorial } from '../help';


import { WELCOME, QUICK_REFERENCE, FULL_API_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

const MINIMIZED = 0;
const SHOWING_PANELS = 1;
const SHOWING_TUTORIAL = 2;

const WELCOME_PANEL = 0;
const BASIC_USAGE_PANEL = 1;
const API_REFERENCE_PANEL = 2;

const App = () => {
    let [ uiState, setUiState ] = useState(MINIMIZED);
    let [ panel, setPanel ] = useState(WELCOME_PANEL);

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
            {
                (() => {
                    switch(uiState) {
                        case MINIMIZED:
                            return (
                            <AccessButton text="Help" onButtonClick={() => {
                                setUiState(SHOWING_PANELS);
                            }}/>
                            );
                        case SHOWING_PANELS:
                            return (
                                <>
                                <TopMenu onMenuChange={handleMenuChange}/>
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
