// ControllerPage.tsx
import React, { useState } from "react";
import GamepadController from "../../components/controls/input/settings/GamepadController.tsx";
import { GamepadMapping, loadGamepadMapping, saveGamepadMapping } from "../../utils/gamepadMapping";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";

const buttonOptions = [
    { label: "A", value: 0 },
    { label: "B", value: 1 },
    { label: "X", value: 2 },
    { label: "Y", value: 3 },
];

const ControllerPage = () => {
    const { t } = useTranslation();
    const [mapping, setMapping] = useState<GamepadMapping>(() => loadGamepadMapping());
    const [status, setStatus] = useState<string>("");

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalized = saveGamepadMapping(mapping);
        setMapping(normalized);
        setStatus(t("controllerPage.saved"));
        setTimeout(() => setStatus(""), 2000);
    };

    return (
        <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 16px" }}>
            <h1 style={{ textAlign: "center" }}>{t("controllerPage.title")}</h1>

            <form onSubmit={onSubmit} style={{ marginTop: 24, marginBottom: 32, display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{t("controllerPage.confirmButton")}</span>
                        <Focusable id="ctrl-confirm-btn" highlightMode="glow">
                            <select
                                value={mapping.confirmButton}
                                onChange={(e) => setMapping({ ...mapping, confirmButton: Number(e.target.value) })}
                                className="form-select"
                            >
                                {buttonOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </Focusable>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{t("controllerPage.backButton")}</span>
                        <Focusable id="ctrl-back-btn" highlightMode="glow">
                            <select
                                value={mapping.backButton}
                                onChange={(e) => setMapping({ ...mapping, backButton: Number(e.target.value) })}
                                className="form-select"
                            >
                                {buttonOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </Focusable>
                    </label>
                </div>

                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{t("controllerPage.deadzone")}</span>
                    <Focusable id="ctrl-deadzone" highlightMode="glow">
                        <input
                            type="range"
                            min={0}
                            max={0.6}
                            step={0.01}
                            value={mapping.deadzone}
                            onChange={(e) => setMapping({ ...mapping, deadzone: Number(e.target.value) })}
                        />
                    </Focusable>
                    <span style={{ fontSize: 14, color: "var(--text-muted, #ccc)" }}>{mapping.deadzone.toFixed(2)}</span>
                </label>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Focusable id="ctrl-save" highlightMode="glow">
                        <button type="submit" className="btn btn-primary">{t("common.save")}</button>
                    </Focusable>
                    {status && <span style={{ color: "var(--success, #4caf50)", fontWeight: 600 }}>{status}</span>}
                </div>
            </form>

            <GamepadController />
        </div>
    );
};

export default ControllerPage;
