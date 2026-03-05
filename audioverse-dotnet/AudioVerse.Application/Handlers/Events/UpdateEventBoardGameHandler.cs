using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventBoardGameHandler(IEventRepository r) : IRequestHandler<UpdateEventBoardGameCommand, bool>
{ public Task<bool> Handle(UpdateEventBoardGameCommand req, CancellationToken ct) => r.UpdateEventBoardGameAsync(req.Link); }
