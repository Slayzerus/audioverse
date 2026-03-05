namespace AudioVerse.Application.Queries.Karaoke;

public record KaraokeSongPickRankingDto(
    int PickId,
    string SongTitle,
    int? SongId,
    int SignupCount,
    bool IsSelected,
    int Rank);
