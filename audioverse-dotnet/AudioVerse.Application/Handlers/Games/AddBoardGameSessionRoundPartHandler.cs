using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddBoardGameSessionRoundPartHandler(IGameRepository r) : IRequestHandler<AddBoardGameSessionRoundPartCommand, int>
{ public Task<int> Handle(AddBoardGameSessionRoundPartCommand req, CancellationToken ct) => r.AddBoardGameSessionRoundPartAsync(req.Part); }
