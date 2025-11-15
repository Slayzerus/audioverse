export interface KaraokeParty {
    id: number;
    name: string;
    description: string;
    organizerId: number;
    startTime: string;
    endTime?: string;
}

export interface KaraokePlayer {
    id: number;
    name: string;
}

export interface KaraokePartyPlayer {
    partyId: number;
    playerId: number;
}

export interface KaraokePartyRound {
    id: number;
    partyId: number;
    playlistId: number;
    songId: number;
    playerId: number;
    number: number;
}

export interface KaraokeSinging {
    id: number;
    roundId: number;
    playerId: number;
    score: number;
}

export interface KaraokeSong {
    id: number;
    title: string;
    artist: string;
    genre: string;
    language: string;
    year: number;
}

export interface CreatePartyRequest {
    name: string;
    description: string;
    organizerId: number;
}

export interface CreatePlayerRequest {
    name: string;
    avatarUrl?: string; // Opcjonalne
}

export interface AssignPlayerToPartyRequest {
    partyId: number;
    playerId: number;
}

export interface AddRoundRequest {
    partyId: number;
    roundNumber: number;
}

export interface AddSongToRoundRequest {
    roundId: number;
    songId: number;
}

export interface SaveResultsRequest {
    results: KaraokeSinging[];
}

// Jeśli `KaraokeSinging` nie istnieje, należy go zdefiniować:
export interface KaraokeSinging {
    songId: number;
    playerId: number;
    score: number;
}

export interface KaraokeSongFile {
    id?: number;
    title: string;
    artist: string;
    genre?: string;
    language?: string;
    year?: string;
    coverPath?: string;
    audioPath?: string;
    videoPath?: string;
    format: KaraokeFormat;
    filePath?: string;
    notes: KaraokeNote[];
}

export interface KaraokeNote {
    id?: number;
    songId?: number;
    song?: KaraokeSongFile;
    noteLine: string;
}

export enum KaraokeFormat {
    Ultrastar = 0
}

