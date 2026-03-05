using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetGamePicksRankedQuery(int EventId, int? Limit) : IRequest<IEnumerable<GamePickRankingDto>>;
