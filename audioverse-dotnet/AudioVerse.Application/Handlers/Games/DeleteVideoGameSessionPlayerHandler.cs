using AudioVerse.Application.Commands.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameSessionPlayerHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameSessionPlayerCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameSessionPlayerCommand req, CancellationToken ct) => r.DeleteVideoGameSessionPlayerAsync(req.Id); }
