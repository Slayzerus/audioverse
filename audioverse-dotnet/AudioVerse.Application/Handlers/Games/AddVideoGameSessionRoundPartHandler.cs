using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameSessionRoundPartHandler(IGameRepository r) : IRequestHandler<AddVideoGameSessionRoundPartCommand, int>
{ public Task<int> Handle(AddVideoGameSessionRoundPartCommand req, CancellationToken ct) => r.AddVideoGameSessionRoundPartAsync(req.Part); }
