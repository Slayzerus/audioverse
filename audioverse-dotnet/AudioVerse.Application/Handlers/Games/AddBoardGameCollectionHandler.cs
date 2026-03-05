using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameCollectionHandler(IGameRepository r) : IRequestHandler<AddBoardGameCollectionCommand, int>
{ public Task<int> Handle(AddBoardGameCollectionCommand req, CancellationToken ct) => r.AddBoardGameCollectionAsync(req.Collection); }
