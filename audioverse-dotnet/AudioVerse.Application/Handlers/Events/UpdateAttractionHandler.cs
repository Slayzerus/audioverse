using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateAttractionHandler(IEventRepository r) : IRequestHandler<UpdateAttractionCommand, bool>
{ public Task<bool> Handle(UpdateAttractionCommand req, CancellationToken ct) => r.UpdateAttractionAsync(req.Item); }
