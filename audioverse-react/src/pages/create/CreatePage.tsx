import React from "react";

const CreatePage: React.FC = () => {
    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
        }}>
            <button type="button">New Project</button>
            <button type="button">Load Project</button>

            <div style={{display:"none"}}>
                <select>
                    <option></option>
                </select>
            </div>
        </div>
    );
};

export default CreatePage;
