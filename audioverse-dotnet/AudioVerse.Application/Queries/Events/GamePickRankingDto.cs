namespace AudioVerse.Application.Queries.Events;

public record GamePickRankingDto(
    int PickId,
    string GameName,
    int? BoardGameId,
    int? VideoGameId,
    int VoteCount,
    int Rank);
