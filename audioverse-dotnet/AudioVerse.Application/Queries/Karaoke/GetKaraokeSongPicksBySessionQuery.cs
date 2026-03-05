using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Queries.Karaoke;

public record GetKaraokeSongPicksBySessionQuery(int SessionId) : IRequest<IEnumerable<KaraokeSessionSongPick>>;
