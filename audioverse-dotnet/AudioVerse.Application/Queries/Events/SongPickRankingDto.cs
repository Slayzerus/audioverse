namespace AudioVerse.Application.Queries.Events;

public record SongPickRankingDto(
    int PickId,
    string SongTitle,
    int? SongId,
    int SignupCount,
    bool IsSelected,
    int Rank);
