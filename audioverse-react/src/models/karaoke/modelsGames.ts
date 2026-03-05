// ── Games domain models ──
// Extracted from modelsKaraoke.ts

// ── Events: Board & Couch Games Assignment ──

export enum GameStatus {
    Available = 0,
    InUse = 1,
    Reserved = 2,
    /** @deprecated Use Reserved */
    Unavailable = 2,
}

export interface EventBoardGame {
    id: number;
    eventId: number;
    boardGameId: number;
    boardGame?: BoardGame | null;
    copyCount: number;
    location?: string | null;
    status: GameStatus;
}

export interface EventVideoGame {
    id: number;
    eventId: number;
    videoGameId: number;
    videoGame?: VideoGame | null;
    station?: string | null;
    status: GameStatus;
}

// ── Board Games ──

export interface BoardGame {
    id: number;
    name?: string | null;
    description?: string | null;
    minPlayers: number;
    maxPlayers: number;
    estimatedDurationMinutes?: number | null;
    genre?: string | null;
    imageKey?: string | null;
    ownerId?: number | null;
    bggId?: number | null;
    bggImageUrl?: string | null;
    bggRating?: number | null;
    bggYearPublished?: number | null;
    boardGameGenreId?: number | null;
    tags?: BoardGameTag[] | null;
}

// ── BGG Integration DTOs ──

export interface BggSearchResult {
    bggId: number;
    name: string;
    yearPublished?: number | null;
}

export interface BggGameDetails {
    bggId: number;
    name: string;
    description?: string | null;
    minPlayers?: number | null;
    maxPlayers?: number | null;
    playingTimeMinutes?: number | null;
    minAge?: number | null;
    yearPublished?: number | null;
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    averageRating?: number | null;
    usersRated?: number | null;
    weight?: number | null;
    rank?: number | null;
    categories?: string[] | null;
    mechanics?: string[] | null;
    designers?: string[] | null;
    artists?: string[] | null;
    publishers?: string[] | null;
}

export interface BggHotGame {
    rank: number;
    bggId: number;
    name: string;
    thumbnailUrl?: string | null;
    yearPublished?: number | null;
}

export interface BggCollectionItem {
    bggId: number;
    name: string;
    yearPublished?: number | null;
    thumbnailUrl?: string | null;
    owned?: boolean;
    wantToPlay?: boolean;
    wantToBuy?: boolean;
    wishlist?: boolean;
    numPlays?: number | null;
    userRating?: number | null;
}

// ── Couch Games ──

export enum GamePlatform {
    PC = 0,
    PS5 = 1,
    Xbox = 2,
    Switch = 3,
    Mobile = 4,
    Other = 5,
    /** @deprecated Use PS5 */
    PlayStation = 1,
    /** @deprecated Use Switch */
    NintendoSwitch = 3,
    /** @deprecated Use Other */
    Web = 5,
}

export interface VideoGame {
    id: number;
    name?: string | null;
    description?: string | null;
    platform: GamePlatform;
    minPlayers: number;
    maxPlayers: number;
    genre?: string | null;
    imageKey?: string | null;
    isLocal: boolean;
    isOnline: boolean;
    ownerId?: number | null;
    steamAppId?: number | null;
    steamHeaderImageUrl?: string | null;
    videoGameGenreId?: number | null;
    igdbId?: number | null;
    coverImageUrl?: string | null;
    importedFrom?: string | null;
}

// ── Board Game Genres & Tags ──

export interface BoardGameGenre {
    id: number;
    name?: string | null;
    parentGenreId?: number | null;
}

export interface BoardGameTag {
    id: number;
    boardGameId: number;
    name?: string | null;
}

export interface VideoGameGenre {
    id: number;
    name?: string | null;
    parentGenreId?: number | null;
}

// ── Board Game Sessions ──

export interface BoardGameSession {
    id: number;
    eventId: number;
    startedAt?: string | null;
    endedAt?: string | null;
    rounds?: BoardGameSessionRound[] | null;
}

export interface BoardGameSessionRound {
    id: number;
    sessionId: number;
    number: number;
    createdAt: string;
    parts?: BoardGameSessionRoundPart[] | null;
}

export interface BoardGameSessionRoundPart {
    id: number;
    roundId: number;
    name?: string | null;
    duration?: string | null;
    players?: BoardGameSessionRoundPartPlayer[] | null;
}

export interface BoardGameSessionRoundPartPlayer {
    id: number;
    partId: number;
    playerId: number;
    score?: number | null;
}

// ── Board Game Collections ──

export interface BoardGameCollection {
    id: number;
    ownerId: number;
    name?: string | null;
    isPublic: boolean;
    createdAt: string;
    parentId?: number | null;
    parent?: BoardGameCollection | null;
    children?: BoardGameCollection[] | null;
    items?: BoardGameCollectionItem[] | null;
}

export interface BoardGameCollectionItem {
    id: number;
    collectionId: number;
    boardGameId: number;
    boardGame?: BoardGame | null;
    copies: number;
}

// ── Video Game Sessions ──

export interface VideoGameSession {
    id: number;
    eventId: number;
    videoGameId: number;
    videoGame?: VideoGame | null;
    startedAt?: string | null;
    endedAt?: string | null;
    players?: VideoGameSessionPlayer[] | null;
    rounds?: VideoGameSessionRound[] | null;
}

export interface VideoGameSessionPlayer {
    id: number;
    sessionId: number;
    playerId: number;
    score?: number | null;
    joinedAt?: string | null;
}

export interface VideoGameSessionRound {
    id: number;
    sessionId: number;
    number: number;
    createdAt: string;
    parts?: VideoGameSessionRoundPart[] | null;
}

export interface VideoGameSessionRoundPart {
    id: number;
    roundId: number;
    name?: string | null;
    duration?: string | null;
    players?: VideoGameSessionRoundPartPlayer[] | null;
}

export interface VideoGameSessionRoundPartPlayer {
    id: number;
    partId: number;
    playerId: number;
    score?: number | null;
}

// ── Video Game Collections ──

export interface VideoGameCollection {
    id: number;
    ownerId: number;
    name?: string | null;
    isPublic: boolean;
    createdAt: string;
    parentId?: number | null;
    parent?: VideoGameCollection | null;
    children?: VideoGameCollection[] | null;
    items?: VideoGameCollectionItem[] | null;
}

export interface VideoGameCollectionItem {
    id: number;
    collectionId: number;
    videoGameId: number;
    videoGame?: VideoGame | null;
    copies: number;
}

// ── Board Game Stats ──

export interface BoardGamePlayerStats {
    playerId: number;
    totalGames: number;
    wins: number;
    avgScore?: number | null;
    topGames?: Array<{ gameId: number; gameName: string; plays: number }> | null;
}

export interface BoardGameStats {
    gameId: number;
    playCount: number;
    avgDuration?: number | null;
}
