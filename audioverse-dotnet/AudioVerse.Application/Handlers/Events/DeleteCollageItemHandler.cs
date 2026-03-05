using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteCollageItemHandler(IEventRepository r) : IRequestHandler<DeleteCollageItemCommand, bool>
{ public Task<bool> Handle(DeleteCollageItemCommand req, CancellationToken ct) => r.DeleteCollageItemAsync(req.Id); }

// â”€â”€ Bulk Invite Job â”€â”€
