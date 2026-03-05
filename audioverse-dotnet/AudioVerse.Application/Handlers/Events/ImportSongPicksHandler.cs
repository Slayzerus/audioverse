using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ImportSongPicksHandler(IEventRepository r) : IRequestHandler<ImportSongPicksFromPlaylistCommand, int>
{ public Task<int> Handle(ImportSongPicksFromPlaylistCommand req, CancellationToken ct) => r.ImportSongPicksFromPlaylistAsync(req.EventId, req.SessionId, req.PlaylistId); }
