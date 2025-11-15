// oxygen25Profile.ts
export type ControlId =
    | { kind: "key"; note: number }
    | { kind: "pad"; note: number }
    | { kind: "knob"; cc: number; index: number }
    | { kind: "fader"; cc: number }
    | { kind: "transport"; cc: number; action: "play" | "stop" | "record" | "rew" | "ff" | "loop" }
    | { kind: "pitchbend" }
    | { kind: "aftertouch" };

export type OxygenLayout = {
    name: string;
    deviceMatch: string; // fragment nazwy urządzenia do automatycznego wyboru
    // domyślne CC/Note – można nadpisać w UI
    knobs: { index: number; cc: number; label: string }[];
    fader?: { cc: number; label: string };
    pads: { note: number; label: string }[]; // nuty dla padów (Note On)
    transport: Partial<Record<"play" | "stop" | "record" | "rew" | "ff" | "loop", number>>; // CC -> akcja
};

export const oxygen25mkiv: OxygenLayout = {
    name: "M-Audio Oxygen 25 (MKIV)",
    deviceMatch: "OXYGEN", // wykryje również „M-Audio OXYGEN 25…”
    // typowy układ: 8 gałek
    knobs: [
        { index: 1, cc: 21, label: "Knob 1" },
        { index: 2, cc: 22, label: "Knob 2" },
        { index: 3, cc: 23, label: "Knob 3" },
        { index: 4, cc: 24, label: "Knob 4" },
        { index: 5, cc: 25, label: "Knob 5" },
        { index: 6, cc: 26, label: "Knob 6" },
        { index: 7, cc: 27, label: "Knob 7" },
        { index: 8, cc: 28, label: "Knob 8" },
    ],
    // 25-ka zwykle ma 1 suwak
    fader: { cc: 7, label: "Fader (Channel Volume)" },
    // 8 padów – startowo mapujemy na klasyczny zakres GM Drums
    pads: [
        { note: 36, label: "Kick C1" },
        { note: 38, label: "Snare D1" },
        { note: 42, label: "HH Closed F#1" },
        { note: 46, label: "HH Open A#1" },
        { note: 48, label: "Tom1 C2" },
        { note: 45, label: "Tom2 A1" },
        { note: 43, label: "Floor G1" },
        { note: 49, label: "Crash C#2" },
    ],
    // transport – wiele sztuk wysyła CC; jeśli Twoja sztuka wysyła MMC/SysEx, UI pokaże „unknown”
    transport: {
        play: 115,
        stop: 114,
        record: 117,
        rew: 112,
        ff: 113,
        loop: 116,
    },
};
