using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetPollByTokenHandler(IEventRepository r) : IRequestHandler<GetPollByTokenQuery, EventPoll?>
{ public Task<EventPoll?> Handle(GetPollByTokenQuery req, CancellationToken ct) => r.GetPollByTokenAsync(req.Token); }
