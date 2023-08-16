import { useState, useRef, useEffect} from 'react';
import ContextMenu from './contextmenu';
import UI from './ui';
import useDrag from '../hooks/usedrag';
import useKeyDown from '../hooks/usekeydown';
import usePasteImage from '../hooks/usepasteimage';
import useMousePos from '../hooks/usemousepos';
import useScale from '../hooks/usescale';
import useUndoStack from '../hooks/useundostack';
import util from '../util';
import Line from './line';
import Note from './note';
import Img from './img';
import Scrap from './scrap';

const noteType = "note";
const imgType = "img";
const scrapType = "scrap";
const lineType = "line";
const debug = false;

const Board = () => {
    const [items, setItems] = useState({});
    const [lines, setLines] = useState([]);
    const scale = useScale();

    const boardRef = useRef(null);

    const [isCreating, setIsCreating] = useState(false);
    const [input, setInput] = useState({pos:{}, text:""});
    const mousePos = useMousePos();

    const doAction = useUndoStack();

    const getBoardPos = () => {
        let rect = boardRef.current.getBoundingClientRect();
        return {x:rect.left, y:rect.top};
    }

    // Panning Board
    function startPan() {
        return boardPos;
    }

    function endPan(dist, e) {
        if(dist < 2 && e.button === 0){
            setIsCreating(false);
        }
    }

    function onDoubleLClick(e) {
        if(e.button !== util.LMB) return;

        // cancel out of creating, if clicked elsewhere
        if(isCreating && input.text === ""){
            setIsCreating(false);
            return;
        }

        // open text window, then 
        let pos = { x: e.clientX, y: e.clientY };
        let boardPos = util.subPos(pos, getBoardPos());
        setInput({
            pos: util.mulPos(boardPos, 1/scale),
            text: ""
        });

        setIsCreating(true);
    }

    useKeyDown(() => {
        addNote();
        setInput({pos:{}, text:""});
        setIsCreating(false);
    }, ["Enter"]);

    useKeyDown(() => {
        setIsCreating(false);
    }, ["Escape"]);

    const [boardPos, onMouseDown] = useDrag(startPan, null, endPan);

    function makeLine(uuid, endUuid){
        if(endUuid == null || endUuid === "")
            return;

        let line = {
            startRef:uuid, 
            endRef:endUuid,
            start:items[uuid].pos, 
            end:items[endUuid].pos,
            uuid:util.getUUID(lineType)
        };

        for(let i = 0; i < lines.length; i++){
            let other = lines[i];

            let exists = other.startRef === line.startRef 
            && other.endRef === line.endRef;

            let existsBackwards = other.startRef === line.endRef 
            && other.endRef === line.startRef;

            if(exists || existsBackwards){
                // if the line exists already, remove it
                doAction({
                    do: () => removeLine(other),
                    undo: () => addLine(other)
                })
                return;
            }
        }

        doAction({
            do: () => addLine(line),
            undo: () => removeLine(line)
        })
    }

    function removeLine(line){
        let newLines = lines.filter(l => l.uuid !== line.uuid);
        setLines(newLines);

        for(const uuid in items){
            if(newLines.filter(l => l.startRef === uuid || l.endRef === uuid).length === 0)
                modifyItem(uuid, item => item.isConnected = false);
        }   
    }

    function addLine(line){
        modifyItem(line.startRef, item => item.isConnected = true);
        modifyItem(line.endRef, item => item.isConnected = true);
        setLines(lines => [...lines, line]);
    }

    function modifyItem(uuid, modify){
        let newItems = {...items};
        modify(newItems[uuid]);
        setItems(newItems);
    }

    function updateItem(uuid, update){
        modifyItem(uuid, update);
        updateLines(uuid);    
    }

    // update the line to match the new item positions
    function updateLines(uuid){
        let newLines = [...lines];
        newLines.forEach(line => {
            if(line.startRef === uuid)
                line.start = util.roundPos(items[uuid].pos);
            else if(line.endRef === uuid)
                line.end = util.roundPos(items[uuid].pos);
        })
        setLines(newLines);
    }

    // Add a new note
    function addNote(){
        if(input.text === "" || input.pos === {})
            return;

        createItem({
            type:input.text.length < 20 ? scrapType : noteType,
            pos:input.pos,
            color:"#feff9c",
            size:{width:150, height:100},
            text:input.text
        });
    }

    // paste images and make new img item
    usePasteImage((src) => {
        let boardPos = util.subPos(mousePos.current, getBoardPos());
        createItem({
            type:imgType,
            pos:util.mulPos(boardPos, 1/scale),
            size:{width:300, height:300},
            src:src
        });
    });

    function createItem(item){
        item.uuid = util.getUUID(item.type);

        doAction({
            id: "make " + item.uuid,
            do: () => addItem(item),
            undo: () => deleteItem(item.uuid)
        })
    }

    function modifyItemAction(doAction, undoAction){
        doAction({
            do:modifyItem(doAction), 
            undo:modifyItem(undoAction)
        });
    }

    function addItem(item){
        item.isConnected = false;

        let itemsCopy = {...items};
        itemsCopy[item.uuid] = item;
        setItems(itemsCopy);
    }

    function deleteItem(uuid){
        let newItems = {...items};
        delete newItems[uuid];
        setItems(newItems);

        let newLines = lines.filter(l => l.startRef !== uuid && l.endRef !== uuid);
        setLines(newLines);
    }

    function onLoad(data){ 
        setItems(data.items); 
        setLines(data.lines);
    }

    // UI's version of data is updating every frame, following the board.

    // 1. Board's data model 
        // should update every frame, to display the notes moving incrementally
    // 2. UI / Save's data model
        // should update every action, ie move from a to b.

    // Render
    return <div onMouseDown = {onMouseDown} onDoubleClick={onDoubleLClick} style={{overflow:'hidden'}}>
        <UI data={{items:items, lines:lines}} onLoad={onLoad}/>

        <div id='boardWrapper' style={util.scaleStyle(scale)} scale={scale}>
            <div className='board' ref = {boardRef} style = {util.posStyle(boardPos)}>
                <ContextMenu boardPos={getBoardPos}/>
                <p style = {{position:'absolute'}}></p>

                {isCreating ? 
                    <input style = {{...util.posStyle(input.pos), position:'absolute'}} autoFocus={true} onChange={(e) => setInput({pos: input.pos, text:e.target.value})}>
                    </input>
                : <></>}

                {renderItems()}

                {lines.map((line) => <Line start={line.start} end={line.end} key={line.uuid}/>)}
            </div>
        </div>
    </div>

    function renderItems(){
        let itemHTML = [];

        for(const uuid in items){
            let item = items[uuid];

            // TODO: Clean up props

            if(item.type === noteType)
                itemHTML.push(
                    <Note key={item.uuid} item={item} update={updateItem} makeLine={makeLine} items={items} boardPos={getBoardPos} deleteItem={deleteItem} debug={debug}/>
                );
            else if(item.type === imgType)
                itemHTML.push(
                    <Img key={item.uuid} item={item} update={updateItem} makeLine={makeLine} items={items} boardPos={getBoardPos} deleteItem={deleteItem} debug={debug}/>
                );
            else if(item.type === scrapType)
                itemHTML.push(
                    <Scrap key={item.uuid} item={item} update={updateItem} makeLine={makeLine} items={items} boardPos={getBoardPos} deleteItem={deleteItem} debug={debug}/>
                );
        }

        return itemHTML;
    }
}

export default Board;