import React from 'react';

const AccessButton = ({text, onButtonClick}) => {
    return (
        <div className="upperrightbutton  helpbutton" onClick={onButtonClick}>{text}</div>
    );
};

export default AccessButton;
