import useSaveLoad from '../hooks/usesaveload';

const UI = (props) => {

    // boardref is null when first run, since it it takes a bit for it to be set by Board.
    const [save, load] = useSaveLoad(props);

    return(
        <div id={"ui"}>
            <div style={{
                display:"flex",
                flexDirection:"column"
            }}>
                
                <div className={"UIButton"} onClick={load}>
                    <span class="material-symbols-outlined">download</span>
                    Import
                </div>
                <div className={"UIButton"} onClick={save}>
                    <span class="material-symbols-outlined">upload</span>
                    Export
                </div>
            </div>
        </div>
    )
}

export default UI;