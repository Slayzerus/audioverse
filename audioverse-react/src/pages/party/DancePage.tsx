import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tab, Tabs, Card, Badge } from "react-bootstrap";
import { PoseDetector, PoseTracker, Pose3DLifter, PoseCamGame } from "../../components/controls/dance";
import DanceClassificationPanel from "../../components/controls/dance/DanceClassificationPanel";

const TAB_KEY = "dancePage_tab";

type DanceTab = "game" | "detect" | "track" | "lift3d" | "classify";

/// Production-ready Dance page with tabbed modes.
const DancePage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<DanceTab>(
        () => (sessionStorage.getItem(TAB_KEY) as DanceTab) || "game",
    );

    const handleTab = (k: string | null) => {
        const tab = (k ?? "game") as DanceTab;
        setActiveTab(tab);
        sessionStorage.setItem(TAB_KEY, tab);
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>🕺 Dance Studio</h2>
                <Badge bg="info" pill>{t('dancePage.beta', 'Beta')}</Badge>
            </div>
            <p style={{ color: "var(--text-muted, #aaa)", marginBottom: 24 }}>
                {t('dancePage.description', 'Use camera and AI for body position recognition. Match poses, track movement, or analyze 3D video.')}
            </p>

            <Tabs activeKey={activeTab} onSelect={handleTab} className="mb-3" fill>
                <Tab eventKey="game" title={t('dancePage.tabPoseGame', '🎮 Pose Game')}>
                    <Card bg="dark" text="white" className="border-0">
                        <Card.Body>
                            <Card.Title>{t('dancePage.poseCamGame', 'Pose Cam Game')}</Card.Title>
                            <Card.Text className="text-muted mb-3">
                                {t('dancePage.poseCamDesc', 'Save a target pose, then match it with your body in front of the camera. The more accurate — the higher the score!')}
                            </Card.Text>
                            <PoseCamGame />
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="detect" title={t('dancePage.tabDetect', '📷 Detect (2D)')}>
                    <Card bg="dark" text="white" className="border-0">
                        <Card.Body>
                            <Card.Title>{t('dancePage.poseDetect', 'Pose Detection — Image')}</Card.Title>
                            <Card.Text className="text-muted mb-3">
                                {t('dancePage.poseDetectDesc', 'Load a single image and detect 2D poses using an AI engine.')}
                            </Card.Text>
                            <PoseDetector />
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="track" title={t('dancePage.tabTrack', '🎬 Track (Video)')}>
                    <Card bg="dark" text="white" className="border-0">
                        <Card.Body>
                            <Card.Title>{t('dancePage.poseTrack', 'Pose Tracking — Video')}</Card.Title>
                            <Card.Text className="text-muted mb-3">
                                {t('dancePage.poseTrackDesc', 'Load a video and track body movements frame by frame.')}
                            </Card.Text>
                            <PoseTracker />
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="lift3d" title={t('dancePage.tab3dLift', '🧊 3D Lift')}>
                    <Card bg="dark" text="white" className="border-0">
                        <Card.Body>
                            <Card.Title>{t('dancePage.3dLifting', '2D → 3D Lifting')}</Card.Title>
                            <Card.Text className="text-muted mb-3">
                                {t('dancePage.3dLiftDesc', 'Transform a 2D sequence into a 3D pose estimation.')}
                            </Card.Text>
                            <Pose3DLifter />
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="classify" title={t('dancePage.tabClassify', '🏷️ Classify')}>
                    <Card bg="dark" text="white" className="border-0">
                        <Card.Body>
                            <Card.Title>{t('dancePage.classifyTitle', 'Dance Classification')}</Card.Title>
                            <Card.Text className="text-muted mb-3">
                                {t('dancePage.classifyDesc', 'Classify songs into dance styles, view matches, and analyze audio parameters.')}
                            </Card.Text>
                            <DanceClassificationPanel />
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
};

export default DancePage;
