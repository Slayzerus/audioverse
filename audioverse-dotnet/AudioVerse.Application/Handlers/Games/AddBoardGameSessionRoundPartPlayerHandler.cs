using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameSessionRoundPartPlayerHandler(IGameRepository r) : IRequestHandler<AddBoardGameSessionRoundPartPlayerCommand, int>
{ public Task<int> Handle(AddBoardGameSessionRoundPartPlayerCommand req, CancellationToken ct) => r.AddBoardGameSessionRoundPartPlayerAsync(req.Player); }
