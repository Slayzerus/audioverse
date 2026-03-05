using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGameSessionRoundsHandler(IGameRepository r) : IRequestHandler<GetVideoGameSessionRoundsQuery, IEnumerable<VideoGameSessionRound>>
{ public Task<IEnumerable<VideoGameSessionRound>> Handle(GetVideoGameSessionRoundsQuery req, CancellationToken ct) => r.GetVideoGameSessionRoundsAsync(req.SessionId); }
