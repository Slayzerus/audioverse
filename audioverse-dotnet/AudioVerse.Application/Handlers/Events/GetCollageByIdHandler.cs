using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetCollageByIdHandler(IEventRepository r) : IRequestHandler<GetCollageByIdQuery, EventCollage?>
{ public Task<EventCollage?> Handle(GetCollageByIdQuery req, CancellationToken ct) => r.GetCollageByIdAsync(req.Id); }
