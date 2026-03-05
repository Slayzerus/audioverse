using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetMediaCollectionByIdHandler(IEventRepository r) : IRequestHandler<GetMediaCollectionByIdQuery, EventMediaCollection?>
{ public Task<EventMediaCollection?> Handle(GetMediaCollectionByIdQuery req, CancellationToken ct) => r.GetMediaCollectionByIdAsync(req.Id); }
