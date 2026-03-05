// VocalEffectsPage.tsx — Page for configuring live vocal effects on microphone
import React from "react";
import { useTranslation } from "react-i18next";
import VocalEffectsPanel from "../../components/controls/input/VocalEffectsPanel";

const VocalEffectsPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
            <h1>{t("vocalEffects.pageTitle", "Vocal Effects")}</h1>
            <p style={{ color: "var(--text-secondary, #64748b)", marginBottom: 24 }}>
                {t("vocalEffects.pageDescription", "Apply live vocal effects to your microphone. Choose from 20 effects — stack multiple at once. Hear the results through your speakers in real time.")}
            </p>
            <VocalEffectsPanel />
        </div>
    );
};

export default VocalEffectsPage;
