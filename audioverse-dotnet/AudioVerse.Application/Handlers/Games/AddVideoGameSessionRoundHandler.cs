using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameSessionRoundHandler(IGameRepository r) : IRequestHandler<AddVideoGameSessionRoundCommand, int>
{ public Task<int> Handle(AddVideoGameSessionRoundCommand req, CancellationToken ct) => r.AddVideoGameSessionRoundAsync(req.Round); }
