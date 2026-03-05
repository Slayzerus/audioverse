namespace AudioVerse.Application.Services.SongInformations;

public record MusicBrainzRelease(
    string Id,
    string Title,
    string? Status,
    string? Date,
    string? Country,
    List<MusicBrainzArtistCredit>? ArtistCredit,
    MusicBrainzReleaseGroup? ReleaseGroup
);
