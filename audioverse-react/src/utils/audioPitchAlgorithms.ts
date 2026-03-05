// audioPitchAlgorithms.ts
// Simulated Ultrastar text generation for different pitch algorithms

export type PitchAlgorithm = "pitchy" | "crepe" | "ultrastarws" | "librosa";

export function generateUltrastarText(algorithm: PitchAlgorithm): string {
  switch (algorithm) {
    case "pitchy":
      return `#TITLE:Analyzed Song\n#ARTIST:AI\n#ALGO:Pitchy\n: 0 4 40 Pitchy\n: 5 3 41 Example\nE`;
    case "crepe":
      return `#TITLE:Analyzed Song\n#ARTIST:AI\n#ALGO:Crepe\n: 0 2 42 Cre\n: 2 2 43 pe\nE`;
    // aubio removed/disabled
    case "librosa":
      return `#TITLE:Analyzed Song\n#ARTIST:AI\n#ALGO:Librosa\n: 0 2 44 Li\n: 2 2 45 bro\nE`;
    case "ultrastarws":
      return `#TITLE:Analyzed Song\n#ARTIST:AI\n#ALGO:UltrastarWS\n: 0 2 46 Ultra\n: 2 2 47 starWS\nE`;
    default:
      return `#TITLE:Analyzed Song\n#ARTIST:AI\n: 0 2 40 Test\nE`;
  }
}
