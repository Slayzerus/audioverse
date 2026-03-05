using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddCollageItemHandler(IEventRepository r) : IRequestHandler<AddCollageItemCommand, int>
{ public Task<int> Handle(AddCollageItemCommand req, CancellationToken ct) => r.AddCollageItemAsync(req.Item); }
