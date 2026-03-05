using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameSessionHandler(IGameRepository r) : IRequestHandler<AddVideoGameSessionCommand, int>
{ public Task<int> Handle(AddVideoGameSessionCommand req, CancellationToken ct) => r.AddVideoGameSessionAsync(req.Session); }
