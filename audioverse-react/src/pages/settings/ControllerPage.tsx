// ControllerPage.tsx
import GamepadController from "../../components/controls/input/settings/GamepadController.tsx";

const ControllerPage = () => {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Connected Gamepads</h1>
            <GamepadController />
        </div>
    );
};

export default ControllerPage;
