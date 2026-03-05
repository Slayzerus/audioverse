using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameCollectionsByOwnerHandler(IGameRepository r) : IRequestHandler<GetBoardGameCollectionsByOwnerQuery, IEnumerable<BoardGameCollection>>
{ public Task<IEnumerable<BoardGameCollection>> Handle(GetBoardGameCollectionsByOwnerQuery req, CancellationToken ct) => r.GetBoardGameCollectionsByOwnerAsync(req.OwnerId); }
