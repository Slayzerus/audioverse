import React from "react";
import { Link } from "react-router-dom";
import { useGameContext, Difficulty } from "../../contexts/GameContext";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import { useBreadcrumbs } from "../../components/breadcrumbs";

const SettingsPage: React.FC = () => {
	const { difficulty, setDifficulty } = useGameContext();
	const { t } = useTranslation();
	const { breadcrumbsEnabled, setBreadcrumbsEnabled } = useBreadcrumbs();

	return (
		<div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
			<h1 style={{ textAlign: "center" }}>{t("settingsPage.title")}</h1>

			<div style={{ marginTop: 24 }}>
				<label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					<span style={{ fontWeight: 600 }}>{t("settingsPage.difficulty")}</span>
					<Focusable id="settings-difficulty" highlightMode="glow">
						<select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="form-select">
							<option value="easy">{t("settingsPage.easy")}</option>
							<option value="normal">{t("settingsPage.normal")}</option>
							<option value="hard">{t("settingsPage.hard")}</option>
						</select>
					</Focusable>
					<small style={{ color: "var(--text-muted, #999)" }}>{t("settingsPage.difficultyHint")}</small>
				</label>
			</div>

			{/* Quick links to sub-settings */}
			<div style={{ marginTop: 32 }}>
				<h5>{t("settingsPage.moreSettings", "More Settings")}</h5>

				{/* Breadcrumbs toggle */}
				<div className="form-check form-switch mb-3">
					<input
						className="form-check-input"
						type="checkbox"
						id="breadcrumbs-toggle"
						checked={breadcrumbsEnabled}
						onChange={e => setBreadcrumbsEnabled(e.target.checked)}
					/>
					<label className="form-check-label" htmlFor="breadcrumbs-toggle">
						{t("settingsPage.showBreadcrumbs", "Show breadcrumb navigation")}
					</label>
					<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
						{t("settingsPage.breadcrumbsHint", "Display a navigation trail at the top of each page.")}
					</small>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					<Focusable id="settings-link-display" highlightMode="glow">
						<Link to="/settings/display" className="btn btn-outline-secondary text-start">
							<i className="fa-solid fa-palette" />{" "}{t("displaySettingsPage.title", "Display Settings")}
							<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
								{t("displaySettingsPage.gradientDesc", "Choose a color preset or create your own custom gradient for sung lyrics.")}
							</small>
						</Link>
					</Focusable>
					<Focusable id="settings-link-audio" highlightMode="glow">
						<Link to="/settings/audio-input" className="btn btn-outline-secondary text-start">
							<i className="fa-solid fa-microphone" />{" "}{t("audioSettingsPage.title", "Audio Inputs")}
						</Link>
					</Focusable>
					<Focusable id="settings-link-controller" highlightMode="glow">
						<Link to="/settings/controller" className="btn btn-outline-secondary text-start">
							<i className="fa-solid fa-gamepad" />{" "}{t("controllerPage.title", "Connected gamepads")}
						</Link>
					</Focusable>
					<Focusable id="settings-link-live-score" highlightMode="glow">
						<Link to="/settings/live-score" className="btn btn-outline-secondary text-start">
							<i className="fa-solid fa-bullseye" />{" "}{t("liveScore.pageTitle", "Live Singing Score")}
							<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
								{t("liveScore.settingsHint", "Test the live singing score endpoint to verify accuracy.")}
							</small>
						</Link>
					</Focusable>
					<Focusable id="settings-link-vocal-effects" highlightMode="glow">
						<Link to="/settings/vocal-effects" className="btn btn-outline-secondary text-start">
							🎙️ {t("vocalEffects.pageTitle", "Vocal Effects")}
							<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
								{t("vocalEffects.settingsHint", "Apply live vocal effects — chipmunk, robot, echo, and more.")}
							</small>
						</Link>
					</Focusable>
					<Focusable id="settings-link-linked-accounts" highlightMode="glow">
						<Link to="/settings/linked-accounts" className="btn btn-outline-secondary text-start">
							🔗 {t("linkedAccounts.title", "Linked Accounts")}
							<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
								{t("linkedAccounts.settingsHint", "Connect Spotify, Tidal, and other music services.")}
							</small>
						</Link>
					</Focusable>
					<Focusable id="settings-link-youtube-subs" highlightMode="glow">
						<Link to="/settings/youtube-subscriptions" className="btn btn-outline-secondary text-start">
							📺 {t("youtubeSubs.title", "YouTube Subscriptions")}
							<small className="d-block" style={{ color: "var(--text-muted, #888)", fontSize: 12 }}>
								{t("youtubeSubs.settingsHint", "Manage your YouTube channel subscriptions.")}
							</small>
						</Link>
					</Focusable>
				</div>
			</div>
		</div>
	);
};

export default SettingsPage;
