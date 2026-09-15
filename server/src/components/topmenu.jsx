import MenuButton from './menubutton.jsx'
import { WELCOME, QUICK_REFERENCE, BASE_API, SOUND_API, ABSTRACT_DATA_TYPES, NOTE_REFERENCE, START_TUTORIAL, CLOSE_HELP } from './menu_constants.js';

// Only the first six are tabs -- the last two are actions, so they never
// show as selected.
// (comment by Claude)
const TopMenu = ({ selectedMenuChoice, onMenuChange }) => {
    return (
        <div className="helpmenupanel">
            <MenuButton
                key="WELCOME"
                text="Welcome"
                selected={selectedMenuChoice == WELCOME}
                onMenuButtonClick={() => onMenuChange(WELCOME)} />
            <MenuButton
                key="QUICK_REFERENCE"
                text="Quick Reference"
                selected={selectedMenuChoice == QUICK_REFERENCE}
                onMenuButtonClick={() => onMenuChange(QUICK_REFERENCE)} />
            <MenuButton
                key="BASE_API"
                text="Base API"
                selected={selectedMenuChoice == BASE_API}
                onMenuButtonClick={() => onMenuChange(BASE_API)} />
            <MenuButton
                key="SOUND_API"
                text="Sound API"
                selected={selectedMenuChoice == SOUND_API}
                onMenuButtonClick={() => onMenuChange(SOUND_API)} />
            <MenuButton
                key="ABSTRACT_DATA_TYPES"
                text="Abstract Data Types"
                selected={selectedMenuChoice == ABSTRACT_DATA_TYPES}
                onMenuButtonClick={() => onMenuChange(ABSTRACT_DATA_TYPES)} />
            <MenuButton
                key="NOTE_REFERENCE"
                text="Note Numbers"
                selected={selectedMenuChoice == NOTE_REFERENCE}
                onMenuButtonClick={() => onMenuChange(NOTE_REFERENCE)} />
            <MenuButton
                key="START_TUTORIAL"
                text="Start Tutorial"
                onMenuButtonClick={() => onMenuChange(START_TUTORIAL)} />
            <MenuButton
                key="CLOSE_HELP"
                text="Close Help"
                onMenuButtonClick={() => onMenuChange(CLOSE_HELP)} />
        </div>
    );
};

export default TopMenu;
