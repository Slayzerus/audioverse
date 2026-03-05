using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateMediaCollectionHandler(IEventRepository r) : IRequestHandler<UpdateMediaCollectionCommand, bool>
{ public Task<bool> Handle(UpdateMediaCollectionCommand req, CancellationToken ct) => r.UpdateMediaCollectionAsync(req.Collection); }
