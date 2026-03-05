using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetSongPicksBySessionHandler(IEventRepository r) : IRequestHandler<GetSongPicksBySessionQuery, IEnumerable<EventSessionSongPick>>
{ public Task<IEnumerable<EventSessionSongPick>> Handle(GetSongPicksBySessionQuery req, CancellationToken ct) => r.GetSongPicksBySessionAsync(req.EventId, req.SessionId); }
