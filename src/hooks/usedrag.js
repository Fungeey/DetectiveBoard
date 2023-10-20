import { useEffect, useRef, useState } from "react";
import useScale from '../hooks/usescale';
import util from "../util";

const useDrag = (doStartDrag, doOnDrag, doEndDrag) => {

    // when implementing useDrag, doStartDrag must return start position
    // function defaultDoStartDrag(mousePos, e){
    // return object's start position
    // }

    // doOnDrag and doEndDrag can be empty

    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [dragButton, setDragButton] = useState(0);

    // replace with useCallback?
    const firstUpdate = useRef(true);
    const scale = useScale();

    useEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
        window.addEventListener('blur', loseFocus, false);

        return () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            window.removeEventListener('blur', loseFocus, false);
        }

    }, [offset]);

    function loseFocus() {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
    }

    function startDrag(e) {
        e.stopPropagation();
        setDragButton(e.button);

        let p = util.getMousePos(e);
        let newStartPos = doStartDrag(p, e);

        setPos(newStartPos);
        setOffset(util.subPos(newStartPos, p));
        setStartPos(p);
    }

    function onDrag(e) {
        let scaleOff = util.mulPos(offset, scale)
        let newPos = util.addPos(util.getMousePos(e), scaleOff);

        // newpos - oldpos to get direction
        // multiply by scale factor

        let vec = util.subPos(newPos, startPos);
        vec = util.mulPos(vec, 1 / scale);
        newPos = util.addPos(startPos, vec);
        newPos = util.roundPos(newPos);

        setPos(newPos);
        if (doOnDrag) doOnDrag(newPos, e);
    }

    function endDrag(e) {
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);

        let dist = util.distance(startPos, util.getMousePos(e));
        let actualStart = util.addPos(startPos, offset);
        if (doEndDrag) doEndDrag(dist, e, actualStart, util.addPos(util.getMousePos(e), offset));
    }

    return [
        pos,
        startDrag,
        dragButton      //remove?
    ]
}

export default useDrag; 