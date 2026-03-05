using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke;

public record GetKaraokeSongPicksRankedQuery(int SessionId, int? MaxRounds) : IRequest<IEnumerable<KaraokeSongPickRankingDto>>;
