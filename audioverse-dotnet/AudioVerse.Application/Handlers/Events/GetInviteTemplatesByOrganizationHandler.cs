using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetInviteTemplatesByOrganizationHandler(IEventRepository r) : IRequestHandler<GetInviteTemplatesByOrganizationQuery, IEnumerable<EventInviteTemplate>>
{ public Task<IEnumerable<EventInviteTemplate>> Handle(GetInviteTemplatesByOrganizationQuery req, CancellationToken ct) => r.GetInviteTemplatesByOrganizationAsync(req.OrganizationId); }

// â”€â”€ Videos â”€â”€
