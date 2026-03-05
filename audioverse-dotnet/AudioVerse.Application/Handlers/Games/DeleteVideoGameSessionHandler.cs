using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameSessionHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameSessionCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameSessionCommand req, CancellationToken ct) => r.DeleteVideoGameSessionAsync(req.Id); }
