using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteBoardGameSessionRoundPartPlayerHandler(IGameRepository r) : IRequestHandler<DeleteBoardGameSessionRoundPartPlayerCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameSessionRoundPartPlayerCommand req, CancellationToken ct) => r.DeleteBoardGameSessionRoundPartPlayerAsync(req.Id); }
