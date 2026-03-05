using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteVideoGameHandler(IEventRepository r) : IRequestHandler<DeleteVideoGameCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameCommand req, CancellationToken ct) => r.DeleteVideoGameAsync(req.Id); }
