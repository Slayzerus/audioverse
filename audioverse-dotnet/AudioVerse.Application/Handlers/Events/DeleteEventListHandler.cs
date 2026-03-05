using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventListHandler(IEventListRepository repo) : IRequestHandler<DeleteEventListCommand, bool>
{
    public async Task<bool> Handle(DeleteEventListCommand req, CancellationToken ct)
        => await repo.DeleteAsync(req.Id, ct);
}

/// <summary>Handles adding a single event to a list.</summary>
