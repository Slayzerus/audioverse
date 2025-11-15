import React from "react";
import HitThatNote from "../../components/games/HitThatNote.tsx";

const PlayPage: React.FC = () => {
    return (
        <div style={{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column"}}>
            <div>Hello World!</div>
            <HitThatNote />
        </div>
    );
};

export default PlayPage;
