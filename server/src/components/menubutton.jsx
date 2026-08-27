
const MenuButton = ({text, selected, onMenuButtonClick}) => {
    const handleClick = () => {
        onMenuButtonClick();
    }

    const className = 'helpmenuitem helpbutton' + (selected ? ' helpmenuitemselected' : '');

    return (
        <div className={className} onClick={handleClick}>{text}</div>
    );
};

export default MenuButton;
