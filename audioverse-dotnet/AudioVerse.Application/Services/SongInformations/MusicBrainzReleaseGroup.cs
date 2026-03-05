namespace AudioVerse.Application.Services.SongInformations;

public record MusicBrainzReleaseGroup(
    string Id,
    string Title,
    string? PrimaryType,
    List<string>? SecondaryTypes
);
