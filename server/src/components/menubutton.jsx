import React from 'react';

const MenuButton = ({text, onMenuButtonClick}) => {
    const handleClick = () => {
        onMenuButtonClick();
    }

    return (
        <div className="helpmenuitem helpbutton" onClick={handleClick}>{text}</div>
    );
};

export default MenuButton;
