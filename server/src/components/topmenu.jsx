import React from 'react';
import MenuButton from './menubutton.jsx'
import { WELCOME, QUICK_REFERENCE, FULL_API_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

const TopMenu = ({onMenuChange}) => {
    return (
        <div className="helpmenupanel">
            <MenuButton
                key="WELCOME"
                text="Welcome"
                onMenuButtonClick={() => onMenuChange(WELCOME)}/>
            <MenuButton
                key="QUICK_REFERENCE"
                text="Quick Reference"
                onMenuButtonClick={() => onMenuChange(QUICK_REFERENCE)}/>
            <MenuButton
                key="FULL_API_REFERENCE"
                text="Full API Reference"
                onMenuButtonClick={() => onMenuChange(FULL_API_REFERENCE)}/>
            <MenuButton
                key="START_TUTORIAL"
                text="Start Tutorial"
                onMenuButtonClick={() => onMenuChange(START_TUTORIAL)}/>
            <MenuButton
                key="CLOSE_HELP"
                text="Close Help"
                onMenuButtonClick={() => onMenuChange(CLOSE_HELP)}/>
        </div>
    );
};

export default TopMenu;
