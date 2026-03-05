using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventVideoGameHandler(IEventRepository r) : IRequestHandler<AddEventVideoGameCommand, int>
{ public Task<int> Handle(AddEventVideoGameCommand req, CancellationToken ct) => r.AddEventVideoGameAsync(req.Link); }
