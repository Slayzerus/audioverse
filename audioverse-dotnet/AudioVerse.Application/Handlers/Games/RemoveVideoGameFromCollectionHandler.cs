using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class RemoveVideoGameFromCollectionHandler(IGameRepository r) : IRequestHandler<RemoveVideoGameFromCollectionCommand, bool>
{ public Task<bool> Handle(RemoveVideoGameFromCollectionCommand req, CancellationToken ct) => r.RemoveVideoGameFromCollectionAsync(req.Id); }
