import React from 'react';
import MenuButton from './menubutton.jsx'

const TutorialMenu = ({onForward, onBack, onClose, onEnd}) => {
    return (
        <div className="helpmenupanel">
            <MenuButton
                key="close-panel"
                text="Close Panel"
                onMenuButtonClick={onClose} />
            {onBack !== null ? (
                    <MenuButton
                    key="previous-panel"
                    text="Previous Panel"
                    onMenuButtonClick={onBack} />
                ) : (<></>)}
            {onForward !== null ? (
                <MenuButton
                key="next-panel"
                text="Next Panel"
                onMenuButtonClick={onForward} />
            ) : (<></>)}
            <MenuButton
                key="end-tutorial"
                text="End Tutorial"
                onMenuButtonClick={onEnd} />
        </div>
    );
};

export default TutorialMenu;
