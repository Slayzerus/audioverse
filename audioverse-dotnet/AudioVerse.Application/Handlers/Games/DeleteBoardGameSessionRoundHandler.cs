using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteBoardGameSessionRoundHandler(IGameRepository r) : IRequestHandler<DeleteBoardGameSessionRoundCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameSessionRoundCommand req, CancellationToken ct) => r.DeleteBoardGameSessionRoundAsync(req.Id); }
