using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetInviteTemplatesByEventHandler(IEventRepository r) : IRequestHandler<GetInviteTemplatesByEventQuery, IEnumerable<EventInviteTemplate>>
{ public Task<IEnumerable<EventInviteTemplate>> Handle(GetInviteTemplatesByEventQuery req, CancellationToken ct) => r.GetInviteTemplatesByEventAsync(req.EventId); }
