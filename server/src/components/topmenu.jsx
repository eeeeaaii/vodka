import MenuButton from './menubutton.jsx'
import { WELCOME, QUICK_REFERENCE, OBJECTS, FULL_API_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

// Only the first three are tabs -- the last two are actions, so they never
// show as selected.
const TopMenu = ({selectedMenuChoice, onMenuChange}) => {
    return (
        <div className="helpmenupanel">
            <MenuButton
                key="WELCOME"
                text="Welcome"
                selected={selectedMenuChoice == WELCOME}
                onMenuButtonClick={() => onMenuChange(WELCOME)}/>
            <MenuButton
                key="QUICK_REFERENCE"
                text="Quick Reference"
                selected={selectedMenuChoice == QUICK_REFERENCE}
                onMenuButtonClick={() => onMenuChange(QUICK_REFERENCE)}/>
            <MenuButton
                key="OBJECTS"
                text="Objects"
                selected={selectedMenuChoice == OBJECTS}
                onMenuButtonClick={() => onMenuChange(OBJECTS)}/>
            <MenuButton
                key="FULL_API_REFERENCE"
                text="Full API Reference"
                selected={selectedMenuChoice == FULL_API_REFERENCE}
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
