// GamepadController.tsx
import { useEffect, useState } from "react";
import { GamepadManager, GamepadState } from "../../../../scripts/input/source/gamepad.ts";

const gamepadManager = new GamepadManager();

const GamepadController = () => {
    const [gamepads, setGamepads] = useState<GamepadState[]>([]);

    useEffect(() => {
        gamepadManager.subscribe(setGamepads);
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Xbox Gamepad Controller</h2>
            {gamepads.length > 0 ? (
                gamepads.map(gamepad => (
                    <div key={gamepad.id} style={{
                        marginBottom: "20px",
                        border: "1px solid #ccc",
                        padding: "10px",
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <p style={{ fontSize: "10px" }}><strong>ID:</strong> {gamepad.id}</p>

                        {/* Układ przycisków */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 80px)",
                            gap: "10px",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            {/* Rzędy przycisków */}
                            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                                <div style={buttonStyle(gamepad.buttons[6], true)}>LT</div>
                                <div style={buttonStyle(gamepad.buttons[7], true)}>RT</div>
                            </div>
                            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                                <div style={buttonStyle(gamepad.buttons[4], true)}>LB</div>
                                <div style={buttonStyle(gamepad.buttons[5], true)}>RB</div>
                            </div>
                            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                                <div style={squareButtonStyle(gamepad.buttons[8])}>SELECT</div>
                                <div style={squareButtonStyle(gamepad.buttons[9])}>MENU</div>
                            </div>

                            {/* Osobny DIV dla A, B, X, Y aby uniknąć deformacji */}
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "10px",
                                marginTop: "10px"
                            }}>
                                <div style={roundButtonStyle(gamepad.buttons[3])}>Y</div>
                                <div style={roundButtonStyle(gamepad.buttons[0])}>A</div>
                                <div style={roundButtonStyle(gamepad.buttons[2])}>X</div>
                                <div style={roundButtonStyle(gamepad.buttons[1])}>B</div>
                            </div>

                            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                                <div style={squareButtonStyle(gamepad.buttons[12])}>UP</div>
                            </div>
                            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                                <div style={squareButtonStyle(gamepad.buttons[14])}>LEFT</div>
                                <div style={squareButtonStyle(gamepad.buttons[13])}>DOWN</div>
                                <div style={squareButtonStyle(gamepad.buttons[15])}>RIGHT</div>
                            </div>
                        </div>

                        {/* Oś analogowa */}
                        <p style={{ fontSize: "10px" }}><strong>L-Axis:</strong> {gamepad.axes.slice(0, 2).map(axis => axis.toFixed(2)).join(", ")}</p>
                        <p style={{ fontSize: "10px" }}><strong>R-Axis:</strong> {gamepad.axes.slice(2, 4).map(axis => axis.toFixed(2)).join(", ")}</p>
                    </div>
                ))
            ) : (
                <p>No gamepad detected. Connect an Xbox controller.</p>
            )}
        </div>
    );
};

// Style dla przycisków
const buttonStyle = (pressed: boolean, flattened = false) => ({
    width: "80px",
    height: flattened ? "20px" : "60px", // Spłaszczone dla LT, RT, LB, RB
    backgroundColor: pressed ? "red" : "gray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "10%",
    fontWeight: "bold",
    fontSize: "10px"
});

const roundButtonStyle = (pressed: boolean) => ({
    width: "40px",
    height: "40px", // Idealnie okrągłe
    backgroundColor: pressed ? "red" : "gray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    fontWeight: "bold",
    fontSize: "10px"
});

const squareButtonStyle = (pressed: boolean) => ({
    width: "40px",
    height: "40px", // Kwadratowe dla D-PAD, SELECT, MENU
    backgroundColor: pressed ? "red" : "gray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "5px",
    fontWeight: "bold",
    fontSize: "10px"
});

export default GamepadController;
