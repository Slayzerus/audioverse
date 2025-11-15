import { useEffect, useRef, useState, useCallback } from "react";

export type MidiCoreEvent =
    | { type: "noteon" | "noteoff"; note: number; velocity: number; channel: number; ts: number; deviceId: string; deviceName: string }
    | { type: "cc"; controller: number; value: number; channel: number; ts: number; deviceId: string; deviceName: string }
    | { type: "aftertouch"; pressure: number; channel: number; ts: number; deviceId: string; deviceName: string }
    | { type: "pitchbend"; value: number; channel: number; ts: number; deviceId: string; deviceName: string }
    | { type: "program"; program: number; channel: number; ts: number; deviceId: string; deviceName: string }
    | { type: "unknown"; status: number; data1?: number; data2?: number; channel?: number; ts: number; deviceId: string; deviceName: string };

export type UseWebMidiOptions = {
    channelFilter?: number;
    sysex?: boolean;
    onEvent?: (ev: MidiCoreEvent) => void;
    inputNameIncludes?: string;
    /// <summary>Called whenever the set of MIDI inputs changes.</summary>
    onInputsChanged?: (inputs: MIDIInput[]) => void;
};

export function useWebMidi(opts: UseWebMidiOptions = {}) {
    const { channelFilter, sysex = false, onEvent, inputNameIncludes, onInputsChanged } = opts;
    const [supported, setSupported] = useState<boolean | null>(null);
    const [granted, setGranted] = useState(false);
    const [inputs, setInputs] = useState<MIDIInput[]>([]);
    const midiAccessRef = useRef<MIDIAccess | null>(null);

    const parseMessage = useCallback(
        (e: MIDIMessageEvent, input: MIDIInput): MidiCoreEvent => {
            const bytes = (e as unknown as { data?: Uint8Array | null }).data ?? new Uint8Array(0);
            const status = bytes[0] ?? 0;
            const d1 = bytes[1] ?? 0;
            const d2 = bytes[2] ?? 0;

            const ts = e.timeStamp;
            const hi = status & 0xf0;
            const ch = status & 0x0f;
            const deviceId = input.id;
            const deviceName = input.name ?? "MIDI Input";
            const chOk = channelFilter === undefined || channelFilter === ch;

            if ((hi === 0x90 || hi === 0x80) && chOk) {
                const isOn = hi === 0x90 && d2 > 0;
                return { type: isOn ? "noteon" : "noteoff", note: d1, velocity: isOn ? d2 : 0, channel: ch, ts, deviceId, deviceName };
            }
            if (hi === 0xB0 && chOk) return { type: "cc", controller: d1, value: d2, channel: ch, ts, deviceId, deviceName };
            if (hi === 0xD0 && chOk) return { type: "aftertouch", pressure: d1, channel: ch, ts, deviceId, deviceName };
            if (hi === 0xE0 && chOk) {
                const v14 = d1 | (d2 << 7);
                return { type: "pitchbend", value: v14 - 8192, channel: ch, ts, deviceId, deviceName };
            }
            if (hi === 0xC0 && chOk) return { type: "program", program: d1, channel: ch, ts, deviceId, deviceName };
            return { type: "unknown", status, data1: d1, data2: d2, channel: ch, ts, deviceId, deviceName };
        },
        [channelFilter]
    );

    useEffect(() => {
        if (!("requestMIDIAccess" in navigator)) {
            setSupported(false);
            return;
        }
        setSupported(true);

        let cancel = false;

        navigator.requestMIDIAccess({ sysex }).then((m) => {
            if (cancel) return;
            midiAccessRef.current = m;
            setGranted(true);

            const refresh = () => {
                const all = Array.from(m.inputs.values());
                const filtered = inputNameIncludes
                    ? all.filter((i) => (i.name || "").toUpperCase().includes(inputNameIncludes.toUpperCase()))
                    : all;

                setInputs(filtered);
                onInputsChanged?.(filtered);

                // detach all, then attach on filtered
                all.forEach((inp) => (inp.onmidimessage = null));
                filtered.forEach((inp) => {
                    inp.onmidimessage = (evt) => onEvent?.(parseMessage(evt, inp));
                });
            };

            refresh();
            m.onstatechange = () => refresh();
        });

        return () => {
            cancel = true;
            const a = midiAccessRef.current;
            if (a) {
                a.inputs.forEach((inp) => (inp.onmidimessage = null));
                a.onstatechange = null;
            }
        };
    }, [inputNameIncludes, onEvent, onInputsChanged, parseMessage, sysex]);

    return { supported, granted, inputs };
}
