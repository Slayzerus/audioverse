/* HelpButton — floating ? button that opens the HelpPanel */
import React, { useState } from "react";
import HelpPanel from "./HelpPanel";

const HelpButton: React.FC = React.memo(function HelpButton() {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <>
            <button
                className="btn btn-primary rounded-circle shadow"
                onClick={() => setShowHelp(true)}
                aria-label="Otwórz pomoc"
                title="Pomoc"
                style={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    width: 48,
                    height: 48,
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    zIndex: 1040,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                }}
            >
                ?
            </button>
            <HelpPanel show={showHelp} onHide={() => setShowHelp(false)} />
        </>
    );
});
HelpButton.displayName = "HelpButton";

export default HelpButton;
