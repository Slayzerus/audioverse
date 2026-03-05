using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetAttractionByIdHandler(IEventRepository r) : IRequestHandler<GetAttractionByIdQuery, EventAttraction?>
{ public Task<EventAttraction?> Handle(GetAttractionByIdQuery req, CancellationToken ct) => r.GetAttractionByIdAsync(req.Id); }
