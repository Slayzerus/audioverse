using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeletePollHandler(IEventRepository r) : IRequestHandler<DeletePollCommand, bool>
{ public Task<bool> Handle(DeletePollCommand req, CancellationToken ct) => r.DeletePollAsync(req.PollId); }
