using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateCollageItemHandler(IEventRepository r) : IRequestHandler<UpdateCollageItemCommand, bool>
{ public Task<bool> Handle(UpdateCollageItemCommand req, CancellationToken ct) => r.UpdateCollageItemAsync(req.Item); }
