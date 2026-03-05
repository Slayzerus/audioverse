// enums.ts — Backend enums for AudioVerse

export enum EventType {
    Event = 0,
    Party = 1,
    Meeting = 2,
    GameNight = 3,
    KaraokeNight = 4,
    MovieNight = 5,
    BookClub = 6,
    SportWatch = 7,
    SportPlay = 8,
    TvShowWatch = 9,
    Custom = 99,
}

export enum EventStatus {
    Created = 0,
    Scheduled = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
}

export enum RecurrencePattern {
    None = 0,
    Daily = 1,
    Weekly = 2,
    BiWeekly = 3,
    Monthly = 4,
    Custom = 5,
}

export enum EventVisibility {
    Private = 0,
    Unlisted = 1,
    Public = 2,
}

export enum NotificationType {
    General = 0,
    EventInvite = 1,
    EventUpdate = 2,
    KaraokeScore = 3,
    PollCreated = 4,
    CommentReply = 5,
    SystemAlert = 6,
    EventReminder = 7,
    PollDeadline = 8,
}

export enum SoundfontFormat {
    SF2 = 0,
    SF3 = 1,
    SFZ = 2,
    DLS = 3,
    GIG = 4,
    Single = 5,
    Other = 99,
}

export enum SoundfontFileType {
    SoundfontBank = 0,
    Readme = 1,
    License = 2,
    PreviewAudio = 3,
    Documentation = 4,
    Thumbnail = 5,
    Other = 99,
}

export enum KaraokeSessionMode {
    Classic = 0,
    Tournament = 1,
    Knockout = 2,
    Casual = 3,
}

export enum KaraokeRoundMode {
    Normal = 0,
    Demo = 1,
    NoLyrics = 2,
    NoTimeline = 3,
    Blindfold = 4,
    SpeedUp = 5,
    SlowDown = 6,
}

export enum LeagueType {
    RoundRobin = 0,
    Knockout = 1,
    Swiss = 2,
    Custom = 3,
}

export enum LeagueStatus {
    Draft = 0,
    Active = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
}
