import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { postOAuthCallback } from "../../scripts/api/apiGames";

type CallbackStatus = "processing" | "success" | "error";

const YouTubeCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<CallbackStatus>("processing");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        if (error) {
            setStatus("error");
            setErrorMsg(error === "access_denied"
                ? "Access denied – you declined the YouTube authorization."
                : `YouTube returned an error: ${error}`);
            return;
        }

        if (!code) {
            setStatus("error");
            setErrorMsg("No authorization code received from YouTube.");
            return;
        }

        const redirectUri = `${window.location.origin}/youtubeCallback`;

        postOAuthCallback("youtube", { code, redirectUri, state })
            .then(() => {
                setStatus("success");
                setTimeout(() => navigate("/settings", { replace: true }), 1500);
            })
            .catch((err: unknown) => {
                setStatus("error");
                const message = err instanceof Error ? err.message : "Unknown error";
                setErrorMsg(`Failed to connect YouTube: ${message}`);
            });
    }, [searchParams, navigate]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
            {status === "processing" && (
                <>
                    <div className="spinner" style={{ width: 48, height: 48, border: "4px solid #ccc", borderTopColor: "#ff0000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <p>Connecting your YouTube account…</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
            )}
            {status === "success" && (
                <>
                    <p style={{ fontSize: "1.5rem" }}>✓</p>
                    <p>YouTube connected! Redirecting…</p>
                </>
            )}
            {status === "error" && (
                <>
                    <p style={{ fontSize: "1.5rem", color: "#e74c3c" }}>✗</p>
                    <p>{errorMsg}</p>
                    <button onClick={() => navigate("/settings", { replace: true })} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
                        Go to Settings
                    </button>
                </>
            )}
        </div>
    );
};

export default YouTubeCallbackPage;
