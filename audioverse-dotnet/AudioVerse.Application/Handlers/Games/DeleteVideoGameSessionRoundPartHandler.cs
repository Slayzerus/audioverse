using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameSessionRoundPartHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameSessionRoundPartCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameSessionRoundPartCommand req, CancellationToken ct) => r.DeleteVideoGameSessionRoundPartAsync(req.Id); }
