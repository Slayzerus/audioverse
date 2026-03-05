using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteBoardGameSessionHandler(IGameRepository r) : IRequestHandler<DeleteBoardGameSessionCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameSessionCommand req, CancellationToken ct) => r.DeleteBoardGameSessionAsync(req.Id); }
