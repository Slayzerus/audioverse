// LiveScorePage.tsx — Page for testing/monitoring live singing score
import React from "react";
import { useTranslation } from "react-i18next";
import LiveScoreMonitor from "../../components/controls/karaoke/LiveScoreMonitor";

const LiveScorePage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
            <h1>{t("liveScore.pageTitle", "Live Singing Score")}</h1>
            <p style={{ color: "var(--text-secondary, #64748b)", marginBottom: 24 }}>
                {t("liveScore.pageDescription", "Test the live singing score endpoint. Start the microphone, sing, and see your score in real time. This helps verify the effectiveness of the scoring algorithm.")}
            </p>
            <LiveScoreMonitor />
        </div>
    );
};

export default LiveScorePage;
