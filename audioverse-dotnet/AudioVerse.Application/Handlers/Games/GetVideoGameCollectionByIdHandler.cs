using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGameCollectionByIdHandler(IGameRepository r) : IRequestHandler<GetVideoGameCollectionByIdQuery, VideoGameCollection?>
{ public Task<VideoGameCollection?> Handle(GetVideoGameCollectionByIdQuery req, CancellationToken ct) => r.GetVideoGameCollectionByIdAsync(req.Id, req.IncludeChildren, req.MaxDepth); }
