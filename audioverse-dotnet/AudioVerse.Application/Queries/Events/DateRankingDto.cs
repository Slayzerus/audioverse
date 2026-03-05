namespace AudioVerse.Application.Queries.Events;

public record DateRankingDto(
    int ProposalId,
    DateTime ProposedStart,
    DateTime? ProposedEnd,
    string? Note,
    int AvailableCount,
    int MaybeCount,
    int UnavailableCount,
    int TotalVotes,
    double Score);
