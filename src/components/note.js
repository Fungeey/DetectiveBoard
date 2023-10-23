import { useRef, useState } from "react";
import useItemBehavior from "../hooks/useitembehavior";
import util from "../util";
import { actions } from "../state/boardstatereducer";
import Card from '@mui/material/Card';

const colors = [
  "#feff9c",      //yellow
  "#FFD09C",       //orange
  "#ff9c9c",      //red
  "#9cccff",      //blue
  "#C4FF9C"      //green
]

const padding = 20; // px;

const Note = ({ props }) => {
  const [render] = useItemBehavior(props);
  const noteRef = useRef(null);

  function doubleClick(e) {
    e.stopPropagation();
    noteRef.current.contentEditable = true;
    noteRef.current.focus();

    document.addEventListener('focusout', unfocus);
    document.addEventListener('keydown', finishEditing);
  }

  function unfocus(e) {
    stopEditing();
    document.removeEventListener('focusout', unfocus);
    document.removeEventListener('keydown', finishEditing);
  }

  function finishEditing(e) {
    if (e.key !== "Enter" && e.key !== "Escape") return;
    e.preventDefault();

    document.removeEventListener('focusout', unfocus);
    document.removeEventListener('keydown', finishEditing);
    stopEditing();
  }

  function stopEditing() {
    noteRef.current.contentEditable = false;

    props.dispatch({ type: actions.updateItem, uuid: props.item.uuid, update: item => item.text = noteRef.current.innerText });
  }

  function getSize() {
    if (props.item.size)
      return util.sizeStyle({
        width: props.item.size.width - padding * 2,
        height: props.item.size.height - padding * 2,
      });
    else
      return util.sizeStyle(150, 100);
  }

  function renderItem(isSelected) {
    return (
      <Card className="noteItem" style={{
        ...getSize(),
        background: props.item.color,
        resize: isSelected ? "both" : "none"
      }} onDoubleClick={doubleClick} ref={noteRef}>
        {props.item.text}
        {props.debug ? <><br /><br />{props.item.uuid}</> : <></>}
      </Card>
    )
  }

  function changeColor(color) {
    props.dispatch({ type: actions.updateItem, uuid: props.item.uuid, update: item => item.color = color });
  }

  function renderSelection(itemRef) {
    function colorSelect(color) {
      return <div style={{
        width: 20,
        height: 20,
        background: color,
      }} key={color}
        onClick={() => changeColor(color)} />
    }

    return (
      <div className="itemSelection" style={{
        top: itemRef.current.clientHeight,
        left: itemRef.current.clientWidth - 20 * 5 - 5 * 5
      }}>
        {colors.map(c => colorSelect(c))}
      </div>
    )
  }

  return render(renderItem, renderSelection);
}

export default Note;