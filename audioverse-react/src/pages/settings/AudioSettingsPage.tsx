// ControllerPage.tsx
import AudioInputDevices from "../../components/controls/input/settings/AudioInputDevices";

const AudioSettingsPage = () => {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Audio Inputs</h1>
            <AudioInputDevices />
        </div>
    );
};

export default AudioSettingsPage;
