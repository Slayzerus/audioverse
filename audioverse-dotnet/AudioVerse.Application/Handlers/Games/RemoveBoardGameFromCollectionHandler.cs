using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class RemoveBoardGameFromCollectionHandler(IGameRepository r) : IRequestHandler<RemoveBoardGameFromCollectionCommand, bool>
{ public Task<bool> Handle(RemoveBoardGameFromCollectionCommand req, CancellationToken ct) => r.RemoveBoardGameFromCollectionAsync(req.Id); }
