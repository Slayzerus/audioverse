using AudioVerse.Application.Commands.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameSessionPlayerHandler(IGameRepository r) : IRequestHandler<AddVideoGameSessionPlayerCommand, int>
{ public Task<int> Handle(AddVideoGameSessionPlayerCommand req, CancellationToken ct) => r.AddVideoGameSessionPlayerAsync(req.Player); }
