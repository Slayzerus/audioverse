using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class GetBoardGameSessionByIdHandler(IGameRepository r) : IRequestHandler<GetBoardGameSessionByIdQuery, BoardGameSession?>
{ public Task<BoardGameSession?> Handle(GetBoardGameSessionByIdQuery req, CancellationToken ct) => r.GetBoardGameSessionByIdAsync(req.Id); }
