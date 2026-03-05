import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AnimatedPersons, { DEFAULT_JUDGES_8 } from "../../components/animations/AnimatedPersons";
import Jurors, { type JurorsHandle } from "../../components/animations/Jurors";
import type { CharacterConfig } from "../../components/animations/characterTypes";
import { seq } from "../../components/animations/choreoDSL";

// Must match the key in AnimatedPersons.tsx
const KEY = "audioverse.judges.list.v1";

/** Page combining character list+editor with jury preview. */
const AnimatedPersonsPage: React.FC = () => {
    const { t } = useTranslation();
    const juryRef = useRef<JurorsHandle>(null);

    // load juror list saved by the editor
    const [people, setPeople] = useState<CharacterConfig[]>(() => {
        try {
            const saved = localStorage.getItem(KEY);
            return saved ? (JSON.parse(saved) as CharacterConfig[]) : DEFAULT_JUDGES_8;
        } catch {
            return DEFAULT_JUDGES_8;
        }
    });

    // manual refresh from localStorage (when you change something in the editor)
    const refreshFromStorage = () => {
        try {
            const saved = localStorage.getItem(KEY);
            setPeople(saved ? (JSON.parse(saved) as CharacterConfig[]) : DEFAULT_JUDGES_8);
        } catch {
            setPeople(DEFAULT_JUDGES_8);
        }
    };

    // optional: auto-refresh after closing edit (button click)
    useEffect(() => {
        const onFocus = () => refreshFromStorage();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    const has4 = useMemo(() => (people?.length ?? 0) >= 4, [people]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-4">
            {/* PANEL: lista + edytor */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t("animatedPersonsPage.editorTitle")}</h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded" onClick={refreshFromStorage}>
                            {t("animatedPersonsPage.refreshPreview")}
                        </button>
                    </div>
                </div>
                <AnimatedPersons />
            </div>

            {/* PANEL: Jury preview */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t("animatedPersonsPage.previewTitle")}</h2>
                    <div className="text-xs text-gray-500">{t("animatedPersonsPage.sourceLabel", { key: KEY })}</div>
                </div>

                <div className="rounded-xl border p-3">
                    {!has4 && (
                        <div className="p-2 text-sm text-amber-700 bg-amber-50 rounded mb-2">
                            {t("animatedPersonsPage.needMoreCharacters")}
                        </div>
                    )}

                    <Jurors ref={juryRef} characters={people.slice(0, 4)} playIntroOnMount autoReact />

                    <div className="flex flex-wrap gap-2 mt-3">
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.playIntro()}>{t("animatedPersonsPage.intro")}</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(9.1)}>{t("animatedPersonsPage.scoreLabel", { value: "9.1" })}</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(6.0)}>{t("animatedPersonsPage.scoreLabel", { value: "6.0" })}</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(3.2)}>{t("animatedPersonsPage.scoreLabel", { value: "3.2" })}</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.wave(seq().waveHand(600))}>{t("animatedPersonsPage.wave")}</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.cannon(seq().jump(400))}>{t("animatedPersonsPage.cannon")}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedPersonsPage;
