// Oxygen25Demo.tsx
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useOxygen25 } from "../../../../scripts/midi/useOxygen25";

type Hit = { t: number; text: string };

export default function Oxygen25Demo() {
    const { t } = useTranslation();
    const [log, setLog] = useState<Hit[]>([]);
    const [knobs, setKnobs] = useState<Record<number, number>>({});
    const [fader, setFader] = useState<number>(0);

    const push = (text: string) => setLog((prev) => [{ t: Date.now(), text }, ...prev].slice(0, 30));

    const { supported, granted, inputs, layout, setLayout: _setLayout, learn, inputsInfo } = useOxygen25(
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
            <h2>{t('oxygen25.title')}</h2>

            {!supported && <p>{t('oxygen25.noWebMidi')}</p>}
            {supported && !granted && <p>{t('oxygen25.requestingPermissions')}</p>}

            <p>
                <b>{t('oxygen25.inputsHook')}</b>{" "}
                {inputs.length ? inputs.map((i) => i.name).join(", ") : t('oxygen25.noInputs')}
                <br />
                <b>{t('oxygen25.inputsEvents')}</b>{" "}
                {inputsInfo.length ? inputsInfo.join(", ") : t('oxygen25.noInputs')}
            </p>

            <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8, padding: 12 }}>
                    <h3>{t('oxygen25.knobs')}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
                        {layout.knobs.map((k) => (
                            <div key={k.index} style={{ border: "1px solid var(--border-subtle, #f3f4f6)", padding: 8, borderRadius: 8 }}>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{k.label}</div>
                                <div>Idx {k.index} — CC {k.cc}</div>
                                <div>Value: {knobs[k.index] ?? 0}</div>
                                <button onClick={() => learn.knob(k.index)}>{t('oxygen25.learnCC')}</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8, padding: 12 }}>
                    <h3>{t('oxygen25.slider')}</h3>
                    <div>CC {layout.fader?.cc ?? "—"} | Value: {fader}</div>
                    <button onClick={() => learn.fader()}>{t('oxygen25.learnFader')}</button>
                </div>

                <div style={{ border: "1px solid var(--border-color, #e5e7eb)", borderRadius: 8, padding: 12 }}>
                    <h3>{t('oxygen25.pads')}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8 }}>
                        {layout.pads.map((p, i) => (
                            <div key={i} style={{ border: "1px solid var(--border-subtle, #f3f4f6)", padding: 8, borderRadius: 8 }}>
                                <div>{p.label}</div>
                                <div>Note: {p.note}</div>
                                <button onClick={() => learn.pad(i)}>{t('oxygen25.learnNote')}</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                    <h3>{t('oxygen25.transport')}</h3>
                    <ul>
                        {(["play","stop","record","rew","ff","loop"] as const).map((a) => (
                            <li key={a}>
                                {a.toUpperCase()}: CC {layout.transport[a] ?? "—"}{" "}
                                <button onClick={() => learn.transport(a)}>{t('oxygen25.learn')}</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <div style={{ marginTop: 16 }}>
                <button onClick={() => { localStorage.removeItem("oxygen25.layout"); location.reload(); }}>
                    {t('oxygen25.resetPreset')}
                </button>
            </div>

            <h3>{t('oxygen25.eventLog')}</h3>
            <ul>
                {log.map((l, i) => <li key={i}>{new Date(l.t).toLocaleTimeString()} — {l.text}</li>)}
            </ul>
        </div>
    );
}
