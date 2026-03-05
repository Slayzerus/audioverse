// Typy i modele dla gry karaoke
export interface Player {
  id: number;
  name: string;
  micId?: string;
  volume: number;
  color?: string;
}

export interface GameState {
  players: Player[];
  mics: MediaDeviceInfo[];
}
