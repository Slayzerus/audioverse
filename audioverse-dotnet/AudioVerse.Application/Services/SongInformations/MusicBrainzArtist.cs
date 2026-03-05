namespace AudioVerse.Application.Services.SongInformations;

public record MusicBrainzArtist(
    string Id,
    string Name,
    string? SortName,
    string? Type,
    string? Country,
    string? Disambiguation,
    MusicBrainzLifeSpan? LifeSpan,
    List<string>? Tags
);
