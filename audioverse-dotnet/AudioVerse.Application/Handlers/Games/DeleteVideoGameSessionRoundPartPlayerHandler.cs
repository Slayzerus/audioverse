using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameSessionRoundPartPlayerHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameSessionRoundPartPlayerCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameSessionRoundPartPlayerCommand req, CancellationToken ct) => r.DeleteVideoGameSessionRoundPartPlayerAsync(req.Id); }
