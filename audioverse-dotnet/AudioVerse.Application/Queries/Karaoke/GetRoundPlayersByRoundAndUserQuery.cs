using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke;

/// <summary>Get karaoke round players by round ID and user ID (profile owner).</summary>
public record GetRoundPlayersByRoundAndUserQuery(int RoundId, int UserId) : IRequest<IEnumerable<KaraokeSessionRoundPlayer>>;
