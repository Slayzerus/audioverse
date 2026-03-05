using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameToCollectionHandler(IGameRepository r) : IRequestHandler<AddBoardGameToCollectionCommand, int>
{ public Task<int> Handle(AddBoardGameToCollectionCommand req, CancellationToken ct) => r.AddBoardGameToCollectionAsync(req.Item); }
