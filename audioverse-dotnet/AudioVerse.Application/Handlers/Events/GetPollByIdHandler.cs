using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPollByIdHandler(IEventRepository r) : IRequestHandler<GetPollByIdQuery, EventPoll?>
{ public Task<EventPoll?> Handle(GetPollByIdQuery req, CancellationToken ct) => r.GetPollByIdAsync(req.PollId); }
