// GamepadController.tsx
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { GamepadManager, GamepadState } from "../../../../scripts/input/source/gamepad.ts";
import { useUser } from "../../../../contexts/UserContext";
import type { DeviceDto } from "../../../../scripts/api/apiUser";

const gamepadManager = new GamepadManager();

const GamepadController = () => {
    const { t } = useTranslation();
    const [gamepads, setGamepads] = useState<GamepadState[]>([]);
    const { userDevices, syncUserDevices } = useUser();
    useEffect(() => {
        gamepadManager.subscribe(setGamepads);
        syncUserDevices();
        // Mount-only: gamepad subscription and initial device sync
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>{t('gamepad.title', 'Xbox Gamepad Controller')}</h2>
            {gamepads.length > 0 ? (
                gamepads.map(gamepad => (
                    <div key={gamepad.id} style={{
                        marginBottom: "20px",
                        border: "1px solid var(--border-color, #d1d5db)",
                        padding: "10px",
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <p style={{ fontSize: "10px" }}><strong>ID:</strong> {gamepad.id}</p>

                        {/* Button layout */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 80px)",
                            gap: "10px",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            {/* Button rows */}
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

                            {/* Separate DIV for A, B, X, Y to avoid deformation */}
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

                        {/* Analog stick */}
                        <p style={{ fontSize: "10px" }}><strong>L-Axis:</strong> {gamepad.axes.slice(0, 2).map(axis => axis.toFixed(2)).join(", ")}</p>
                        <p style={{ fontSize: "10px" }}><strong>R-Axis:</strong> {gamepad.axes.slice(2, 4).map(axis => axis.toFixed(2)).join(", ")}</p>
                    </div>
                ))
            ) : (
                <p>{t('gamepad.noGamepad', 'No gamepad detected. Connect an Xbox controller.')}</p>
            )}
            <h3 style={{ marginTop: 32 }}>{t('gamepad.registeredGamepads', 'Registered user gamepads')}</h3>
            {userDevices.filter((d: DeviceDto) => d.deviceType === 2).map((dev: DeviceDto) => (
                <div key={dev.deviceId} style={{ border: "1px solid var(--border-subtle, #888)", margin: "8px 0", padding: 8, borderRadius: 8 }}>
                    <div><b>ID:</b> {dev.deviceId}</div>
                    <div><b>{t('gamepad.visible', 'Visible')}:</b> {dev.visible ? t('common.yes', 'Yes') : t('common.no', 'No')}</div>
                    {/* Ability to hide/edit gamepad */}
                </div>
            ))}
        </div>
    );
};

// Styles for buttons
const buttonStyle = (pressed: boolean, flattened = false) => ({
    width: "80px",
    height: flattened ? "20px" : "60px",
    backgroundColor: pressed ? "var(--control-pressed, #ff5252)" : "var(--control, #9ca3af)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "10%",
    fontWeight: "bold",
    fontSize: "10px"
});

const roundButtonStyle = (pressed: boolean) => ({
    width: "40px",
    height: "40px",
    backgroundColor: pressed ? "var(--control-pressed, #ff5252)" : "var(--control, #9ca3af)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    fontWeight: "bold",
    fontSize: "10px"
});

const squareButtonStyle = (pressed: boolean) => ({
    width: "40px",
    height: "40px",
    backgroundColor: pressed ? "var(--control-pressed, #ff5252)" : "var(--control, #9ca3af)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "5px",
    fontWeight: "bold",
    fontSize: "10px"
});

export default GamepadController;
