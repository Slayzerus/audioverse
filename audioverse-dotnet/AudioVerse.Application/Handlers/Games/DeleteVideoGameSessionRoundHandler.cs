using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameSessionRoundHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameSessionRoundCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameSessionRoundCommand req, CancellationToken ct) => r.DeleteVideoGameSessionRoundAsync(req.Id); }
