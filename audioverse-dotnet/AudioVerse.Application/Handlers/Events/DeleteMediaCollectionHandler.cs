using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteMediaCollectionHandler(IEventRepository r) : IRequestHandler<DeleteMediaCollectionCommand, bool>
{ public Task<bool> Handle(DeleteMediaCollectionCommand req, CancellationToken ct) => r.DeleteMediaCollectionAsync(req.Id); }

// â”€â”€ Collages â”€â”€
