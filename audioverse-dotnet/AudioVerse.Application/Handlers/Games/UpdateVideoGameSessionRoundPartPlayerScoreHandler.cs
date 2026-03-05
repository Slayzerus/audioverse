using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class UpdateVideoGameSessionRoundPartPlayerScoreHandler(IGameRepository r) : IRequestHandler<UpdateVideoGameSessionRoundPartPlayerScoreCommand, bool>
{ public Task<bool> Handle(UpdateVideoGameSessionRoundPartPlayerScoreCommand req, CancellationToken ct) => r.UpdateVideoGameSessionRoundPartPlayerScoreAsync(req.Id, req.Score); }
