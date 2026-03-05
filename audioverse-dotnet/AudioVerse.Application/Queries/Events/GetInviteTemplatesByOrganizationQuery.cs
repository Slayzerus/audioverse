using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetInviteTemplatesByOrganizationQuery(int OrganizationId) : IRequest<IEnumerable<EventInviteTemplate>>;
