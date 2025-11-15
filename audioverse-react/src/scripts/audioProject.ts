export interface AudioSection {
    name: string;
    layers: string[];
}

export interface AudioProject {
    name: string;
    sections: AudioSection[];
}

export const initialProjects: AudioProject[] = [
    {
        name: "Song 1",
        sections: [
            { name: "Verse", layers: ["Vocal", "Drums"] },
            { name: "Chorus", layers: ["Guitar", "Bass"] }
        ]
    },
    {
        name: "Song 2",
        sections: [
            { name: "Woo", layers: ["Synth", "Percussion"] },
            { name: "Hoo", layers: ["FX", "Pad"] }
        ]
    }
];
