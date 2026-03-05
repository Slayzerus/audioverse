// RootLayout.tsx — Root layout with Navbar, a11y, and loading state
import React from "react";
import { Outlet, useNavigation } from "react-router-dom";
import Navbar from "../components/Navbar";
import ScrollToTop from "../components/common/ScrollToTop";
import TutorialOverlay from "../components/common/TutorialOverlay";
import ErrorBoundary from "../components/common/ErrorBoundary";
import PageSpinner from "../components/common/PageSpinner";
import HelpButton from "../components/common/HelpButton";
import { Breadcrumbs } from "../components/breadcrumbs";
import GamepadBar from "../components/GamepadBar";
import NoteRiver from "../components/NoteRiver";
import NoteParticles from "../components/NoteParticles";
import { RadioProvider, useRadio } from "../contexts/RadioContext";

/**
 * Inner layout — must be rendered inside RadioProvider so it can call useRadio().
 */
const RootLayoutInner: React.FC = () => {
    const navigation = useNavigation();
    const { detectedMidiRef } = useRadio();

    return (
        <>
            {/* Skip navigation for screen readers / keyboard users */}
            <a
                href="#main-content"
                className="skip-nav-link"
                style={{
                    position: "absolute",
                    top: "-100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 9999,
                    padding: "0.75rem 1.5rem",
                    background: "var(--accent, #3b82f6)",
                    color: "#fff",
                    borderRadius: "0 0 0.5rem 0.5rem",
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "top 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.top = "0"; }}
                onBlur={(e) => { e.currentTarget.style.top = "-100%"; }}
            >
                Skip to main content
            </a>
            <ScrollToTop />
            <TutorialOverlay />
            <Navbar />
            <NoteRiver pitchMidiRef={detectedMidiRef} />
            <GamepadBar />
            <Breadcrumbs />
            <main id="main-content" tabIndex={-1} role="main" aria-label="Main content">
                <ErrorBoundary>
                    <React.Suspense fallback={<PageSpinner />}>
                        {navigation.state === "loading" ? <PageSpinner /> : <Outlet />}
                    </React.Suspense>
                </ErrorBoundary>
            </main>
            <HelpButton />
            <NoteParticles />
        </>
    );
};

const RootLayout: React.FC = () => (
    <RadioProvider>
        <RootLayoutInner />
    </RadioProvider>
);

export default RootLayout;
