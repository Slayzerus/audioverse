using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class ImportKaraokeSongPicksHandler(IKaraokeSongPickRepository r) : IRequestHandler<ImportKaraokeSongPicksCommand, int>
{ public Task<int> Handle(ImportKaraokeSongPicksCommand req, CancellationToken ct) => r.ImportKaraokeSongPicksFromPlaylistAsync(req.SessionId, req.PlaylistId); }
