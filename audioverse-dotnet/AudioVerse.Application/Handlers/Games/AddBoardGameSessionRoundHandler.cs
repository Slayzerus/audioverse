using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameSessionRoundHandler(IGameRepository r) : IRequestHandler<AddBoardGameSessionRoundCommand, int>
{ public Task<int> Handle(AddBoardGameSessionRoundCommand req, CancellationToken ct) => r.AddBoardGameSessionRoundAsync(req.Round); }
