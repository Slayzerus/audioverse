using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventBoardGameHandler(IEventRepository r) : IRequestHandler<AddEventBoardGameCommand, int>
{ public Task<int> Handle(AddEventBoardGameCommand req, CancellationToken ct) => r.AddEventBoardGameAsync(req.Link); }
