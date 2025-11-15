// DmxEditorPage.tsx
import React from "react";
import DmxEditor from "../../components/controls/dmx/DmxEditor";

export default function DmxEditorPage() {
    return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            <header>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                    DMX Editor
                </h1>
                <p style={{ color: "#6b7280", fontSize: 14 }}>
                    Zarządzaj urządzeniami DMX, konfiguracją portu i kanałami.
                </p>
            </header>

            <main>
                <DmxEditor />
            </main>
        </div>
    );
}
