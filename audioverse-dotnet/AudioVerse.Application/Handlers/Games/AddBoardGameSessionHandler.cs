using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameSessionHandler(IGameRepository r) : IRequestHandler<AddBoardGameSessionCommand, int>
{ public Task<int> Handle(AddBoardGameSessionCommand req, CancellationToken ct) => r.AddBoardGameSessionAsync(req.Session); }
