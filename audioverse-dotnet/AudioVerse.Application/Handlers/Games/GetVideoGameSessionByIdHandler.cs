using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGameSessionByIdHandler(IGameRepository r) : IRequestHandler<GetVideoGameSessionByIdQuery, VideoGameSession?>
{ public Task<VideoGameSession?> Handle(GetVideoGameSessionByIdQuery req, CancellationToken ct) => r.GetVideoGameSessionByIdAsync(req.Id); }
