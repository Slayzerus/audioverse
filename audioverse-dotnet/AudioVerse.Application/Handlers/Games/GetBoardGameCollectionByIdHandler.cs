using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameCollectionByIdHandler(IGameRepository r) : IRequestHandler<GetBoardGameCollectionByIdQuery, BoardGameCollection?>
{ public Task<BoardGameCollection?> Handle(GetBoardGameCollectionByIdQuery req, CancellationToken ct) => r.GetBoardGameCollectionByIdAsync(req.Id, req.IncludeChildren, req.MaxDepth); }
