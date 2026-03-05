using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetVideoGameCollectionsByOwnerHandler(IGameRepository r) : IRequestHandler<GetVideoGameCollectionsByOwnerQuery, IEnumerable<VideoGameCollection>>
{ public Task<IEnumerable<VideoGameCollection>> Handle(GetVideoGameCollectionsByOwnerQuery req, CancellationToken ct) => r.GetVideoGameCollectionsByOwnerAsync(req.OwnerId); }
