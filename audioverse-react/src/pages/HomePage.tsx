import React from "react";


const HomePage: React.FC = () => {
    return (
        <div style={{
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "100px 20px 20px 20px;"
        }}>
            <h1>Welcome to AudioVerse</h1>
            <p style={{ maxWidth: "600px", fontSize: "1.2em", marginBottom: "20px" }}>
                A revolutionary platform that brings music, entertainment, and interaction together.
                Get ready for an immersive experience featuring karaoke, musical games, competitions,
                and an endless world of musical discovery.
            </p>
            <p style={{ maxWidth: "600px", fontSize: "1em", fontStyle: "italic" }}>
                Whether you love singing, creating, or simply enjoying music,
                AudioVerse has something special for you.
            </p>
            <p style={{ fontWeight: "bold", fontSize: "1.1em", marginTop: "20px" }}>
                Stay tuned – coming soon!
            </p>
        </div>
    );
};

export default HomePage;
