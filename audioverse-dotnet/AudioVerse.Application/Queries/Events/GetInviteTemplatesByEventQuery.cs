using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetInviteTemplatesByEventQuery(int EventId) : IRequest<IEnumerable<EventInviteTemplate>>;
