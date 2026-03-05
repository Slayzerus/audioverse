// ── Event domain models ──
// Extracted from modelsKaraoke.ts

import type { EventParticipant, KaraokeSinging } from './modelsKaraokeCore';

// ── Event aggregate ──

export enum EventType {
    Unknown = 0,
    Event = 1,
    Meeting = 2,
    Conference = 3,
    Workshop = 4,
    GameNight = 5,
    Screening = 6,
    /** @deprecated Use EventType.Event for karaoke events */
    Karaoke = 1,
    /** @deprecated */
    Concert = 1,
    /** @deprecated */
    Other = 0,
}

export enum EventAccessType {
    Public = 0,
    Private = 1,
    Code = 2,
    Link = 3,
}

export enum EventStatus {
    Created = 0,
    Planned = 1,
    ItsOn = 2,
    Finished = 3,
    Cancelled = 4,
}

export enum EventLocationType {
    Virtual = 0,
    Real = 1,
}

export enum EventVisibility {
    Private = 0,
    Unlisted = 1,
    Public = 2,
}

/** Tab visibility configuration attached to an Event. */
export interface EventTab {
    id: number;
    eventId: number;
    /** Display name (e.g. "Photos", "Chat"). */
    name: string;
    /** Identifier key matching PartyTab (e.g. "photos", "chat"). */
    key: string;
    /** Icon (emoji or FA class name). */
    icon?: string | null;
    /** Display order (lower = first). */
    sortOrder: number;
    /** Visible to organizer. */
    visibleOrganizer: boolean;
    /** Visible to event participants (RSVP'd users). */
    visibleParticipant: boolean;
    /** Visible to guests (anonymous / no RSVP). */
    visibleGuest: boolean;
    /** Soft-enable flag. */
    isEnabled: boolean;
}

export interface Event {
    id: number;
    title?: string | null;
    /** Alias for title (backward compat) */
    name?: string | null;
    description?: string | null;
    type: EventType;
    startTime?: string | null;
    endTime?: string | null;
    /**
     * ID of the event organizer.
     * MIGRATION: Transitioning from UserProfile.Id to Player (UserProfilePlayer) ID.
     * After backend migration, this will be a Player.Id.
     */
    organizerId?: number | null;
    maxParticipants?: number | null;
    waitingListEnabled?: boolean;
    visibility?: EventVisibility;
    locationId?: number | null;
    locationName?: string | null;
    status?: EventStatus;
    locationType?: EventLocationType;
    access?: EventAccessType;
    codeHash?: string | null;
    accessToken?: string | null;
    poster?: string | null;
    /** Tab visibility overrides configured by the organizer. */
    tabs?: EventTab[];
}

export enum EventInviteStatus {
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Cancelled = 3,
    /** @deprecated Use Declined */
    Rejected = 2,
}

export interface EventInvite {
    id: number;
    eventId?: number | null;
    fromUserId?: number | null;
    toUserId?: number | null;
    toEmail?: string | null;
    status: EventInviteStatus;
    message?: string | null;
    createdAt: string;
    respondedAt?: string | null;
}

export interface SendEventInviteRequest {
    toUserId?: number | null;
    toEmail?: string | null;
    message?: string | null;
}

// ── User profile player (from backend Identity) ──

export interface UserProfilePlayer {
    id: number;
    name?: string | null;
    displayName?: string | null;
    color?: string | null;
    profileId: number;
    preferredColors?: string | null;
    isPrimary: boolean;
    email?: string | null;
    icon?: string | null;
    photoUrl?: string | null;
    /** Linked Contact (business card) ID — if user has a contact entry */
    contactId?: number | null;
    /** Events this player is a participant of */
    linkedParties?: EventParticipant[] | null;
    linkedSinging?: KaraokeSinging[] | null;
    /**
     * Events organized by this player.
     * MIGRATION: After Event.OrganizerId migrates to Player FK, the backend
     * should populate this via a navigation property on UserProfilePlayer.
     */
    organizedParties?: Event[] | null;
}

export interface UserProfilePlayerDto {
    id: number;
    name?: string | null;
    profileId: number;
    preferredColors?: string | null;
    isPrimary: boolean;
    email?: string | null;
    icon?: string | null;
    photoUrl?: string | null;
}

// ── EventPlayerStatus — aligned with backend EventParticipantStatus ──

export enum EventPlayerStatus {
    /** Signed-up (RSVP) but not yet arrived */
    Registered = 0,
    /** Arrived, waiting for bouncer */
    Waiting = 1,
    /** Bouncer is currently validating */
    Validation = 2,
    /** Admitted inside the event */
    Inside = 3,
    /** Outside (rejected or stepped out) */
    Outside = 4,
    /** Has left the event */
    Left = 5,
    /** Participation cancelled by user */
    Cancelled = 6,
}

/** @deprecated Use EventPlayerStatus */
export const PartyPlayerStatus = EventPlayerStatus;
export type PartyPlayerStatus = EventPlayerStatus;

// ── EventPermission (was PartyPermissionFlag) ──

export enum EventPermission {
    None = 0,
    Invite = 1,
    ManageMusic = 2,
    Admit = 4,
    Moderate = 8,
    Bouncer = 16,
    All = 31,
}

/** @deprecated Use EventPermission */
export const PartyPermissionFlag = EventPermission;
export type PartyPermissionFlag = EventPermission;

// ── Events: Schedule, Menu, Attractions ──

export enum ScheduleCategory {
    Karaoke = 0,
    Food = 1,
    Game = 2,
    Break = 3,
    Custom = 4,
    /** @deprecated */
    General = 0,
    /** @deprecated */
    Performance = 1,
    /** @deprecated */
    Other = 4,
}

export interface EventScheduleItem {
    id: number;
    eventId: number;
    title?: string | null;
    description?: string | null;
    startTime: string;
    endTime?: string | null;
    category: ScheduleCategory;
    location?: string | null;
    sortOrder?: number;
}

export enum MenuItemCategory {
    Food = 0,
    Drink = 1,
    Snack = 2,
    Dessert = 3,
}

export interface EventMenuItem {
    id: number;
    eventId: number;
    name?: string | null;
    description?: string | null;
    category: MenuItemCategory;
    price?: number | null;
    isAvailable: boolean;
    imageKey?: string | null;
    allergens?: string | null;
    isVegetarian?: boolean;
    isVegan?: boolean;
}

export enum EventAttractionType {
    PhotoBooth = 0,
    DanceFloor = 1,
    KaraokeBooth = 2,
    DJSet = 3,
    Custom = 4,
    /** @deprecated */
    Generic = 0,
    /** @deprecated */
    KaraokeStage = 2,
    /** @deprecated */
    Lounge = 4,
}

export interface EventAttraction {
    id: number;
    eventId: number;
    name?: string | null;
    description?: string | null;
    type: EventAttractionType;
    location?: string | null;
    capacity?: number | null;
    isActive: boolean;
    imageKey?: string | null;
    price?: number | null;
}

// ── Events: Billing ──

export enum ExpenseCategory {
    Food = 0,
    Drink = 1,
    Attraction = 2,
    Rental = 3,
    Equipment = 4,
    Transport = 5,
    Custom = 6,
    /** @deprecated Use Drink */
    Drinks = 1,
    /** @deprecated Use Rental */
    Venue = 2,
    /** @deprecated Use Custom */
    Entertainment = 5,
    /** @deprecated Use Custom */
    Other = 6,
}

export enum SplitMethod {
    Equal = 0,
    PerCapita = 1,
    Custom = 2,
    ByPollResponse = 3,
    /** @deprecated Use PerCapita */
    ByQuantity = 1,
    /** @deprecated Use ByPollResponse */
    ByPoll = 3,
}

export interface EventExpenseShare {
    id: number;
    expenseId: number;
    expense?: EventExpense | null;
    userId?: number | null;
    email?: string | null;
    shareAmount: number;
    quantity: number;
}

export interface EventExpense {
    id: number;
    eventId: number;
    title?: string | null;
    description?: string | null;
    category: ExpenseCategory;
    amount: number;
    currency?: string | null;
    splitMethod: SplitMethod;
    sourcePollId?: number | null;
    sourceMenuItemId?: number | null;
    sourceAttractionId?: number | null;
    paidByUserId?: number | null;
    createdAt: string;
    shares?: EventExpenseShare[] | null;
}

export enum PaymentMethod {
    Cash = 0,
    BankTransfer = 1,
    Blik = 2,
    PayPal = 3,
    Card = 4,
    Other = 5,
}

export enum PaymentStatus {
    Pending = 0,
    Confirmed = 1,
    Rejected = 2,
    Refunded = 3,
    /** @deprecated Use Refunded */
    Cancelled = 3,
}

export interface EventPayment {
    id: number;
    eventId: number;
    userId?: number | null;
    email?: string | null;
    payerName?: string | null;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    reference?: string | null;
    note?: string | null;
    paidAt: string;
    confirmedByUserId?: number | null;
    confirmedAt?: string | null;
}

// ── Events: Polls ──

export enum PollType {
    SingleChoice = 0,
    MultiChoice = 1,
    YesNo = 2,
    /** @deprecated Use MultiChoice */
    MultipleChoice = 1,
    /** @deprecated Use YesNo */
    Quantity = 2,
}

export enum PollOptionSource {
    Manual = 0,
    BoardGames = 1,
    VideoGames = 2,
    Songs = 3,
    MenuItems = 4,
    Attractions = 5,
    /** @deprecated Use BoardGames */
    Menu = 1,
}

export interface EventPollOption {
    id: number;
    pollId: number;
    text?: string | null;
    sortOrder: number;
    sourceEntityId?: number | null;
    sourceEntityType?: PollOptionSource;
    unitCost?: number | null;
    imageUrl?: string | null;
}

export interface EventPollResponse {
    id: number;
    pollId: number;
    optionId: number;
    option?: EventPollOption | null;
    respondentEmail?: string | null;
    respondentUserId?: number | null;
    quantity: number;
    respondedAt: string;
}

export interface EventPoll {
    id: number;
    eventId: number;
    title?: string | null;
    description?: string | null;
    type: PollType;
    optionSource: PollOptionSource;
    token?: string | null;
    createdAt: string;
    expiresAt?: string | null;
    isActive: boolean;
    createdByUserId?: number | null;
    trackCosts?: boolean;
    options?: EventPollOption[] | null;
    responses?: EventPollResponse[] | null;
}

export interface VotePollRequest {
    optionIds?: number[] | null;
    email?: string | null;
    quantities?: Record<string, number> | null;
}

export interface SendPollEmailsRequest {
    emails?: string[] | null;
}

// ── EventLocation ──

export interface EventLocation {
    id: number;
    name?: string | null;
    description?: string | null;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    countryCode?: string | null;
    formattedAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    website?: string | null;
    virtualUrl?: string | null;
    url?: string | null;
}

// ── Event Photos ──

export interface EventPhoto {
    id: number;
    eventId: number;
    objectKey?: string | null;
    caption?: string | null;
    uploadedByUserId?: number | null;
    createdAt: string;
    collectionId?: number | null;
    /** Self-referencing FK — points to the unedited original photo (if this is a filtered copy) */
    originalId?: number | null;
    /** Serialised PhotoEditorState JSON so the edit can be re-opened / modified later */
    filtersJson?: string | null;
}

// ── Event Videos ──

export interface EventVideo {
    id: number;
    eventId: number;
    objectKey?: string | null;
    caption?: string | null;
    uploadedByUserId?: number | null;
    createdAt: string;
    collectionId?: number | null;
    /** Duration in seconds (set by backend after upload) */
    durationSeconds?: number | null;
    /** Thumbnail object key (auto-generated by backend) */
    thumbnailKey?: string | null;
    /** Self-referencing FK — points to the unedited original video */
    originalId?: number | null;
    /** Serialised VideoClipState JSON for re-editing */
    filtersJson?: string | null;
}

// ── Event Comments ──

export interface EventComment {
    id: number;
    eventId: number;
    userId?: number | null;
    text?: string | null;
    parentId?: number | null;
    replies?: EventComment[] | null;
    createdAt: string;
}

// ── Event Date Proposals (Doodle-like scheduling) ──

export enum DateVoteStatus {
    Available = 0,
    Maybe = 1,
    Unavailable = 2,
}

export interface EventDateProposal {
    id: number;
    eventId: number;
    proposedStart: string;
    proposedEnd?: string | null;
    proposedByUserId?: string | null;
    note?: string | null;
    createdAt: string;
    votes?: EventDateVote[] | null;
}

export interface EventDateVote {
    id: number;
    proposalId: number;
    userId: string;
    status: DateVoteStatus;
    comment?: string | null;
    votedAt: string;
}

export interface DateBestResult {
    proposalId: number;
    proposedStart: string;
    proposedEnd?: string | null;
    note?: string | null;
    availableCount: number;
    maybeCount: number;
    unavailableCount: number;
    totalVotes: number;
    score: number;
}

// ── Event Session Game Picks ──

export interface EventSessionGamePick {
    id: number;
    eventId: number;
    sourceCollectionId?: number | null;
    boardGameId?: number | null;
    videoGameId?: number | null;
    gameName: string;
    createdAt: string;
    votes?: EventSessionGameVote[] | null;
}

export interface EventSessionGameVote {
    id: number;
    pickId: number;
    userId: string;
    priority: number;
    votedAt: string;
}

export interface GamePickRankedResult {
    pickId: number;
    gameName: string;
    boardGameId?: number | null;
    videoGameId?: number | null;
    voteCount: number;
    rank: number;
}

// ── Event Session Song Picks ──

export interface EventSessionSongPick {
    id: number;
    eventId: number;
    sessionId: number;
    sourcePlaylistId?: number | null;
    songId?: number | null;
    songTitle: string;
    createdAt: string;
    signups?: EventSessionSongSignup[] | null;
}

export interface EventSessionSongSignup {
    id: number;
    pickId: number;
    userId: string;
    preferredSlot?: number | null;
    signedUpAt: string;
}

export interface SongPickRankedResult {
    pickId: number;
    songTitle: string;
    songId?: number | null;
    signupCount: number;
    makesTheCut: boolean;
    rank: number;
}

// ── Organization ──

export interface Organization {
    id: number;
    name?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    website?: string | null;
    ownerId?: number | null;
    createdAt: string;
    leagues?: League[] | null;
}

// ── League ──

export enum LeagueType {
    RoundRobin = 0,
    SingleElimination = 1,
    DoubleElimination = 2,
    Swiss = 3,
    Ladder = 4,
    Custom = 5,
}

export enum LeagueStatus {
    Draft = 0,
    Registration = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
}

export interface League {
    id: number;
    name?: string | null;
    description?: string | null;
    type: LeagueType;
    organizationId?: number | null;
    organization?: Organization | null;
    logoUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    maxParticipants?: number | null;
    ownerId?: number | null;
    status: LeagueStatus;
    createdAt: string;
    events?: LeagueEvent[] | null;
    participants?: LeagueParticipant[] | null;
}

export interface LeagueParticipant {
    id: number;
    leagueId: number;
    userId?: number | null;
    name?: string | null;
    seed?: number | null;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    isEliminated: boolean;
    joinedAt: string;
}

export interface LeagueEvent {
    id: number;
    leagueId: number;
    eventId: number;
    roundNumber?: number | null;
    matchNumber?: number | null;
    label?: string | null;
}

// ── Betting ──

export enum BettingMarketType {
    WinLose = 0,
    OverUnder = 1,
    Prop = 2,
    Custom = 99,
}

export interface BettingOption {
    id: number;
    marketId: number;
    label?: string | null;
    odds: number;
}

export interface Bet {
    id: number;
    marketId: number;
    optionId: number;
    userId: number;
    amount: number;
    potentialPayout: number;
    won?: boolean | null;
    actualPayout: number;
    placedAt: string;
}

export interface BettingMarket {
    id: number;
    eventId: number;
    leagueId?: number | null;
    title?: string | null;
    description?: string | null;
    type: BettingMarketType;
    isOpen: boolean;
    winningOptionId?: number | null;
    createdAt: string;
    resolvedAt?: string | null;
    options?: BettingOption[] | null;
    bets?: Bet[] | null;
}

export interface UserWallet {
    userId: number;
    balance: number;
    totalWagered: number;
    totalWon: number;
}

// ── Fantasy ──

export interface FantasyTeamPlayer {
    id: number;
    fantasyTeamId: number;
    externalPlayerId?: string | null;
    name?: string | null;
    position?: string | null;
    realTeam?: string | null;
    points: number;
    isActive: boolean;
    draftOrder?: number | null;
    addedAt: string;
}

export interface FantasyTeam {
    id: number;
    leagueId: number;
    userId: number;
    name?: string | null;
    totalPoints: number;
    rank?: number | null;
    createdAt: string;
    players?: FantasyTeamPlayer[] | null;
}

