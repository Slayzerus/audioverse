using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class GetKaraokeSongPicksBySessionHandler(IKaraokeSongPickRepository r) : IRequestHandler<GetKaraokeSongPicksBySessionQuery, IEnumerable<KaraokeSessionSongPick>>
{ public Task<IEnumerable<KaraokeSessionSongPick>> Handle(GetKaraokeSongPicksBySessionQuery req, CancellationToken ct) => r.GetKaraokeSongPicksBySessionAsync(req.SessionId); }
