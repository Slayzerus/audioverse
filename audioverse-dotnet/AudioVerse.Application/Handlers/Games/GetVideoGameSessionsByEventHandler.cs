using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGameSessionsByEventHandler(IGameRepository r) : IRequestHandler<GetVideoGameSessionsByEventQuery, IEnumerable<VideoGameSession>>
{ public Task<IEnumerable<VideoGameSession>> Handle(GetVideoGameSessionsByEventQuery req, CancellationToken ct) => r.GetVideoGameSessionsByEventAsync(req.EventId); }
