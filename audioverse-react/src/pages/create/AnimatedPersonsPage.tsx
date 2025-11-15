import React, { useEffect, useMemo, useRef, useState } from "react";
import AnimatedPersons, { DEFAULT_JUDGES_8 } from "../../components/animations/AnimatedPersons";
import Jurors, { type JurorsHandle } from "../../components/animations/Jurors";
import type { CharacterConfig } from "../../components/animations/characterTypes";
import { seq } from "../../components/animations/choreoDSL";

// Musi być zgodny z kluczem w AnimatedPersons.tsx
const KEY = "audioverse.judges.list.v1";

/** Strona łącząca listę+edytor postaci z podglądem jury. */
const AnimatedPersonsPage: React.FC = () => {
    const juryRef = useRef<JurorsHandle>(null);

    // wczytaj listę jurorów zapisaną przez edytor
    const [people, setPeople] = useState<CharacterConfig[]>(() => {
        try {
            const saved = localStorage.getItem(KEY);
            return saved ? (JSON.parse(saved) as CharacterConfig[]) : DEFAULT_JUDGES_8;
        } catch {
            return DEFAULT_JUDGES_8;
        }
    });

    // ręczne odświeżenie z localStorage (gdy zmienisz coś w edytorze)
    const refreshFromStorage = () => {
        try {
            const saved = localStorage.getItem(KEY);
            setPeople(saved ? (JSON.parse(saved) as CharacterConfig[]) : DEFAULT_JUDGES_8);
        } catch {
            setPeople(DEFAULT_JUDGES_8);
        }
    };

    // opcjonalnie: auto-odśwież po zamknięciu edycji (klik w przycisk)
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
                    <h2 className="text-lg font-semibold">Edytor postaci</h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded" onClick={refreshFromStorage}>
                            Odśwież podgląd
                        </button>
                    </div>
                </div>
                <AnimatedPersons />
            </div>

            {/* PANEL: podgląd Jury */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Podgląd w grze (Jury)</h2>
                    <div className="text-xs text-gray-500">Źródło: localStorage → {KEY}</div>
                </div>

                <div className="rounded-xl border p-3">
                    {!has4 && (
                        <div className="p-2 text-sm text-amber-700 bg-amber-50 rounded mb-2">
                            Dodaj co najmniej 4 postaci w edytorze po lewej, aby zobaczyć kompletne jury.
                        </div>
                    )}

                    <Jurors ref={juryRef} characters={people.slice(0, 4)} playIntroOnMount autoReact />

                    <div className="flex flex-wrap gap-2 mt-3">
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.playIntro()}>Intro</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(9.1)}>Score 9.1</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(6.0)}>Score 6.0</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.reactToScore(3.2)}>Score 3.2</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.wave(seq().waveHand(600))}>Wave</button>
                        <button className="px-3 py-1 border rounded" onClick={() => juryRef.current?.cannon(seq().jump(400))}>Cannon</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedPersonsPage;
