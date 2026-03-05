using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateEventVideoGameHandler(IEventRepository r) : IRequestHandler<UpdateEventVideoGameCommand, bool>
{ public Task<bool> Handle(UpdateEventVideoGameCommand req, CancellationToken ct) => r.UpdateEventVideoGameAsync(req.Link); }
