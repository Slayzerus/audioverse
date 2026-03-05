import { useCallback, useMemo, useRef, useState } from "react";
import { useWebMidi, MidiCoreEvent } from "./useWebMidi";
import { oxygen25mkiv, OxygenLayout } from "./oxygen25Profile";

export type OxygenEvents = {
    onKey?: (e: { note: number; velocity: number; ts: number; device: string }) => void;
    onPad?: (e: { note: number; velocity: number; ts: number; device: string }) => void;
    onKnob?: (e: { index: number; cc: number; value: number; ts: number; device: string }) => void;
    onFader?: (e: { cc: number; value: number; ts: number; device: string }) => void;
    onTransport?: (e: { action: keyof OxygenLayout["transport"]; value: number; ts: number; device: string }) => void;
    onPitchBend?: (e: { value: number; ts: number; device: string }) => void;
    onAftertouch?: (e: { pressure: number; ts: number; device: string }) => void;
    onUnknown?: (raw: MidiCoreEvent) => void;
};

export type LearnState =
    | { mode: "idle" }
    | { mode: "knob"; index: number }
    | { mode: "fader" }
    | { mode: "pad"; padIdx: number }
    | { mode: "transport"; action: keyof OxygenLayout["transport"] };

export function useOxygen25(events: OxygenEvents = {}, preset: OxygenLayout = oxygen25mkiv) {
    const [layout, setLayout] = useState<OxygenLayout>(() => {
        const saved = localStorage.getItem("oxygen25.layout");
        return saved ? JSON.parse(saved) : preset;
    });

    const [inputsInfo, setInputsInfo] = useState<string[]>([]);
    const learnRef = useRef<LearnState>({ mode: "idle" });

    const commitLayout = useCallback((upd: Partial<OxygenLayout>) => {
        setLayout((prev) => {
            const next = { ...prev, ...upd };
            localStorage.setItem("oxygen25.layout", JSON.stringify(next));
            return next;
        });
    }, []);

    const onEvent = useCallback(
        (ev: MidiCoreEvent) => {
            // save device name immediately when anything arrives
            const name = ev.deviceName || "MIDI";
            setInputsInfo((prev) => (prev.includes(name) ? prev : [...prev, name]));

            // learn / normal handling – no changes…
            const learn = learnRef.current;
            if (learn.mode !== "idle") {
                if (learn.mode === "knob" && ev.type === "cc") {
                    const idx = learn.index;
                    commitLayout({ knobs: layout.knobs.map((k) => (k.index === idx ? { ...k, cc: ev.controller } : k)) });
                    learnRef.current = { mode: "idle" };
                    return;
                }
                if (learn.mode === "fader" && ev.type === "cc") {
                    commitLayout({ fader: { cc: ev.controller, label: "Fader" } });
                    learnRef.current = { mode: "idle" };
                    return;
                }
                if (learn.mode === "pad" && ev.type === "noteon") {
                    const pads = layout.pads.slice();
                    pads[learn.padIdx] = { ...pads[learn.padIdx], note: ev.note };
                    commitLayout({ pads });
                    learnRef.current = { mode: "idle" };
                    return;
                }
                if (learn.mode === "transport" && ev.type === "cc") {
                    const tr = { ...layout.transport };
                    tr[learn.action] = ev.controller;
                    commitLayout({ transport: tr });
                    learnRef.current = { mode: "idle" };
                    return;
                }
            }

            switch (ev.type) {
                case "noteon": {
                    const padIdx = layout.pads.findIndex((p) => p.note === ev.note);
                    if (padIdx >= 0) events.onPad?.({ note: ev.note, velocity: ev.velocity, ts: ev.ts, device: name });
                    else events.onKey?.({ note: ev.note, velocity: ev.velocity, ts: ev.ts, device: name });
                    break;
                }
                case "cc": {
                    if (layout.fader && ev.controller === layout.fader.cc) {
                        events.onFader?.({ cc: ev.controller, value: ev.value, ts: ev.ts, device: name });
                        break;
                    }
                    const k = layout.knobs.find((k) => k.cc === ev.controller);
                    if (k) {
                        events.onKnob?.({ index: k.index, cc: ev.controller, value: ev.value, ts: ev.ts, device: name });
                        break;
                    }
                    const act = (Object.keys(layout.transport) as (keyof OxygenLayout["transport"])[]).find(
                        (a) => layout.transport[a] === ev.controller
                    );
                    if (act) {
                        events.onTransport?.({ action: act, value: ev.value, ts: ev.ts, device: name });
                        break;
                    }
                    events.onUnknown?.(ev);
                    break;
                }
                case "pitchbend":
                    events.onPitchBend?.({ value: ev.value, ts: ev.ts, device: name });
                    break;
                case "aftertouch":
                    events.onAftertouch?.({ pressure: ev.pressure, ts: ev.ts, device: name });
                    break;
                default:
                    events.onUnknown?.(ev);
            }
        },
        [commitLayout, events, layout]
    );

    const { supported, granted, inputs } = useWebMidi({
        // important: don't filter by name – show everything
        inputNameIncludes: undefined,
        onEvent,
        sysex: false,
        channelFilter: undefined,
        onInputsChanged: (ins) => setInputsInfo(ins.map((i) => i.name || "MIDI")),
    });

    const learn = useMemo(
        () => ({
            knob: (index: number) => (learnRef.current = { mode: "knob", index }),
            fader: () => (learnRef.current = { mode: "fader" }),
            pad: (padIdx: number) => (learnRef.current = { mode: "pad", padIdx }),
            transport: (action: keyof OxygenLayout["transport"]) => (learnRef.current = { mode: "transport", action }),
            cancel: () => (learnRef.current = { mode: "idle" }),
            state: () => learnRef.current,
        }),
        []
    );

    return { supported, granted, inputs, layout, setLayout: commitLayout, learn, inputsInfo };
}
