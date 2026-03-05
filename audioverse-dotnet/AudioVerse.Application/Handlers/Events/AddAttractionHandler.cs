using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddAttractionHandler(IEventRepository r) : IRequestHandler<AddAttractionCommand, int>
{ public Task<int> Handle(AddAttractionCommand req, CancellationToken ct) => r.AddAttractionAsync(req.Item); }
