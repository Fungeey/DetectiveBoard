import { useEffect, useState } from "react";
import useKeyDown from '../hooks/usekeydown';
import { actions } from "./boardstatereducer";

function useSelectionBehavior(props) {
    const [isSelected, setIsSelected] = useState(false);

    useEffect(() => {
        document.addEventListener('click', onClickDocument);
        return () => document.removeEventListener('click', onClickDocument);
    }, []);

    function onClickDocument(e) {
        if (!e.target.parentElement) return;
        // deselect if click anywhere other than this note.
        let target = e.target.parentElement.parentElement.getAttribute("uuid");
        if (target !== props.item.uuid)
            deSelect();
    }

    function select() {
        setIsSelected(true);
    }

    function deSelect() {
        setIsSelected(false);
    }

    useKeyDown(deSelect, ["Enter", "Escape"]);

    function deleteItem() {
        props.doAction({
            do: () => props.dispatch({ 
                type: actions.deleteItem, item: props.item }),
            undo: () => props.dispatch({ 
                type: actions.createItem, item: props.item })
        });
    }

    function renderSelection(itemRef, renderItemSelection) {
        return <div>
            <img src={require('../img/delete.png')} alt="delete icon"
                style={{
                    width: 20,
                    height: 20,
                    top: itemRef.current.clientHeight + 5,
                    left: 0,
                    position: "absolute"
                }} onClick={deleteItem} />

            {renderItemSelection ? renderItemSelection(itemRef) : <></>}
        </div>
    }

    return [
        isSelected,
        select,
        deSelect,
        renderSelection
    ]
}

export default useSelectionBehavior;