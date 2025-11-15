// Oxygen25Demo.tsx
import React, { useState } from "react";
import { useOxygen25 } from "../../../../scripts/midi/useOxygen25";

type Hit = { t: number; text: string };

export default function Oxygen25Demo() {
    const [log, setLog] = useState<Hit[]>([]);
    const [knobs, setKnobs] = useState<Record<number, number>>({});
    const [fader, setFader] = useState<number>(0);

    const push = (text: string) => setLog((prev) => [{ t: Date.now(), text }, ...prev].slice(0, 30));

    const { supported, granted, inputs, layout, setLayout, learn, inputsInfo } = useOxygen25(
        {
            onKey: ({ note, velocity }) => push(`KEY note=${note} vel=${velocity}`),
            onPad: ({ note, velocity }) => push(`PAD note=${note} vel=${velocity}`),
            onKnob: ({ index, value }) => {
                setKnobs((k) => ({ ...k, [index]: value }));
            },
            onFader: ({ value }) => setFader(value),
            onTransport: ({ action, value }) => push(`TRANSPORT ${action}=${value}`),
            onPitchBend: ({ value }) => push(`PITCHBEND ${value}`),
            onAftertouch: ({ pressure }) => push(`AFTERTOUCH ${pressure}`),
            onUnknown: (raw) => push(`UNKNOWN ${JSON.stringify(raw)}`),
        }
    );

    return (
        <div style={{ fontFamily: "system-ui", lineHeight: 1.4, padding: 16 }}>
            <h2>M-Audio Oxygen 25 (MKIV) — integracja</h2>

            {!supported && <p>Twoja przeglądarka nie wspiera Web MIDI.</p>}
            {supported && !granted && <p>Proszę o nadanie uprawnień MIDI…</p>}

            <p>
                <b>Wejścia (z hooka):</b>{" "}
                {inputs.length ? inputs.map((i) => i.name).join(", ") : "(brak)"}
                <br />
                <b>Wejścia (z eventów):</b>{" "}
                {inputsInfo.length ? inputsInfo.join(", ") : "(brak)"}
            </p>

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                    <h3>Gałki</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
                        {layout.knobs.map((k) => (
                            <div key={k.index} style={{ border: "1px solid #eee", padding: 8, borderRadius: 8 }}>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{k.label}</div>
                                <div>Idx {k.index} — CC {k.cc}</div>
                                <div>Value: {knobs[k.index] ?? 0}</div>
                                <button onClick={() => learn.knob(k.index)}>Learn CC</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                    <h3>Suwak</h3>
                    <div>CC {layout.fader?.cc ?? "—"} | Value: {fader}</div>
                    <button onClick={() => learn.fader()}>Learn Fader</button>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                    <h3>Pady</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
                        {layout.pads.map((p, i) => (
                            <div key={i} style={{ border: "1px solid #eee", padding: 8, borderRadius: 8 }}>
                                <div>{p.label}</div>
                                <div>Note: {p.note}</div>
                                <button onClick={() => learn.pad(i)}>Learn Note</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                    <h3>Transport</h3>
                    <ul>
                        {(["play","stop","record","rew","ff","loop"] as const).map((a) => (
                            <li key={a}>
                                {a.toUpperCase()}: CC {layout.transport[a] ?? "—"}{" "}
                                <button onClick={() => learn.transport(a)}>Learn</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <div style={{ marginTop: 16 }}>
                <button onClick={() => { localStorage.removeItem("oxygen25.layout"); location.reload(); }}>
                    Reset preset/learn
                </button>
            </div>

            <h3>Log zdarzeń</h3>
            <ul>
                {log.map((l, i) => <li key={i}>{new Date(l.t).toLocaleTimeString()} — {l.text}</li>)}
            </ul>
        </div>
    );
}
