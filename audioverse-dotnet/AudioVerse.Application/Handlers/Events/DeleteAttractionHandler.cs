using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteAttractionHandler(IEventRepository r) : IRequestHandler<DeleteAttractionCommand, bool>
{ public Task<bool> Handle(DeleteAttractionCommand req, CancellationToken ct) => r.DeleteAttractionAsync(req.Id); }
