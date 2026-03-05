using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetVideoGameByIdHandler(IEventRepository r) : IRequestHandler<GetVideoGameByIdQuery, VideoGame?>
{ public Task<VideoGame?> Handle(GetVideoGameByIdQuery req, CancellationToken ct) => r.GetVideoGameByIdAsync(req.Id); }
