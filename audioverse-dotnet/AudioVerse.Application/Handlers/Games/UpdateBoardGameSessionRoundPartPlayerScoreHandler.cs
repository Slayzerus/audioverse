using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class UpdateBoardGameSessionRoundPartPlayerScoreHandler(IGameRepository r) : IRequestHandler<UpdateBoardGameSessionRoundPartPlayerScoreCommand, bool>
{ public Task<bool> Handle(UpdateBoardGameSessionRoundPartPlayerScoreCommand req, CancellationToken ct) => r.UpdateBoardGameSessionRoundPartPlayerScoreAsync(req.Id, req.Score); }
