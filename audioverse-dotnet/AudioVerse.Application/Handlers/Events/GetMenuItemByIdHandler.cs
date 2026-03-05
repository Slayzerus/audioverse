using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetMenuItemByIdHandler(IEventRepository r) : IRequestHandler<GetMenuItemByIdQuery, EventMenuItem?>
{ public Task<EventMenuItem?> Handle(GetMenuItemByIdQuery req, CancellationToken ct) => r.GetMenuItemByIdAsync(req.Id); }
