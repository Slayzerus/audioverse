using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddMediaCollectionHandler(IEventRepository r) : IRequestHandler<AddMediaCollectionCommand, int>
{ public Task<int> Handle(AddMediaCollectionCommand req, CancellationToken ct) => r.AddMediaCollectionAsync(req.Collection); }
