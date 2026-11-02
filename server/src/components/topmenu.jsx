import MenuButton from './menubutton.jsx'
import { WELCOME, QUICK_REFERENCE, BASE_API, SOUND_API, GRAPHICS_API, API_REFERENCE, ABSTRACT_DATA_TYPES, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

// The last two are actions, not tabs, so they never show as selected.
const TABS = [
    [WELCOME, 'Welcome'],
    [QUICK_REFERENCE, 'Quick Reference'],
    [BASE_API, 'Base API'],
    [SOUND_API, 'Sound API'],
    [GRAPHICS_API, 'Graphics API'],
    [API_REFERENCE, 'API Reference'],
    [ABSTRACT_DATA_TYPES, 'Abstract Data Types'],
];

const TopMenu = ({ selectedMenuChoice, onMenuChange }) => {
    return (
        <div className="helpmenupanel">
            {TABS.map(([choice, text]) =>
                <MenuButton
                    key={text}
                    text={text}
                    selected={selectedMenuChoice == choice}
                    onMenuButtonClick={() => onMenuChange(choice)} />)}
            <MenuButton
                key="START_TUTORIAL"
                text="Start Tutorial"
                onMenuButtonClick={() => onMenuChange(START_TUTORIAL)} />
            <MenuButton
                key="CLOSE_HELP"
                text="Close"
                onMenuButtonClick={() => onMenuChange(CLOSE_HELP)} />
        </div>
    );
};

export default TopMenu;
