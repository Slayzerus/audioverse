// ControllerPage.tsx
import AudioInputDevices from "../../components/controls/input/settings/AudioInputDevices";
import { useTranslation } from "react-i18next";

const AudioSettingsPage = () => {
    const { t } = useTranslation();
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>{t("audioSettingsPage.title")}</h1>
            <AudioInputDevices />
        </div>
    );
};

export default AudioSettingsPage;
