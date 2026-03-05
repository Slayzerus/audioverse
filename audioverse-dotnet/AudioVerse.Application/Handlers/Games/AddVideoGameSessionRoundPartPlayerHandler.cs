using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameSessionRoundPartPlayerHandler(IGameRepository r) : IRequestHandler<AddVideoGameSessionRoundPartPlayerCommand, int>
{ public Task<int> Handle(AddVideoGameSessionRoundPartPlayerCommand req, CancellationToken ct) => r.AddVideoGameSessionRoundPartPlayerAsync(req.Player); }
