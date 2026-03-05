using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventVideoGameHandler(IEventRepository r) : IRequestHandler<DeleteEventVideoGameCommand, bool>
{ public Task<bool> Handle(DeleteEventVideoGameCommand req, CancellationToken ct) => r.DeleteEventVideoGameAsync(req.Id); }
