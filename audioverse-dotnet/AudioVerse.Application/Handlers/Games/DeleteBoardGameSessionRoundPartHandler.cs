using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteBoardGameSessionRoundPartHandler(IGameRepository r) : IRequestHandler<DeleteBoardGameSessionRoundPartCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameSessionRoundPartCommand req, CancellationToken ct) => r.DeleteBoardGameSessionRoundPartAsync(req.Id); }
