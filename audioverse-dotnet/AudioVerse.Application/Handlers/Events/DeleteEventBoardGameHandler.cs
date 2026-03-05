using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventBoardGameHandler(IEventRepository r) : IRequestHandler<DeleteEventBoardGameCommand, bool>
{ public Task<bool> Handle(DeleteEventBoardGameCommand req, CancellationToken ct) => r.DeleteEventBoardGameAsync(req.Id); }
