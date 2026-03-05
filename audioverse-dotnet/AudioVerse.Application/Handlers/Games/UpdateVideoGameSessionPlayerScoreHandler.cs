using AudioVerse.Application.Commands.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class UpdateVideoGameSessionPlayerScoreHandler(IGameRepository r) : IRequestHandler<UpdateVideoGameSessionPlayerScoreCommand, bool>
{ public Task<bool> Handle(UpdateVideoGameSessionPlayerScoreCommand req, CancellationToken ct) => r.UpdateVideoGameSessionPlayerScoreAsync(req.Id, req.Score); }
