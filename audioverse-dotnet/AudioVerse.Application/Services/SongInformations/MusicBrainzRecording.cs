namespace AudioVerse.Application.Services.SongInformations;

public record MusicBrainzRecording(
    string Id,
    string Title,
    int? Length,
    string? Disambiguation,
    List<MusicBrainzArtistCredit>? ArtistCredit,
    List<MusicBrainzRelease>? Releases,
    List<string>? Isrcs
);
