using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetSongPicksRankedQuery(int EventId, int SessionId, int? MaxRounds) : IRequest<IEnumerable<SongPickRankingDto>>;
