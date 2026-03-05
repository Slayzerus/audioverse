using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdatePollHandler(IEventRepository r) : IRequestHandler<UpdatePollCommand, bool>
{ public Task<bool> Handle(UpdatePollCommand req, CancellationToken ct) => r.UpdatePollAsync(req.Poll); }
