import React from "react";
import {PoseDetector, PoseTracker, Pose3DLifter, PoseCamGame} from "../../components/controls/dance";

/// Page to test AI pose components (2D image, 2D video tracking, 3D lifting).
const DancePage: React.FC = () => {
    return (
        <div style={{display: "grid", gap: 32, padding: 16}}>
            <h2>Dance Playground</h2>
            <section>
                <h3>PoseCamGame</h3>
                <PoseCamGame/>
            </section>
            <section>
                <h3>PoseDetector (Image → 2D)</h3>
                <PoseDetector/>
            </section>

            <section>
                <h3>PoseTracker (Video → 2D sequence)</h3>
                <PoseTracker/>
            </section>

            <section>
                <h3>Pose3DLifter (2D sequence / video → 3D)</h3>
                <Pose3DLifter/>
            </section>
        </div>
    );
};

export default DancePage;
