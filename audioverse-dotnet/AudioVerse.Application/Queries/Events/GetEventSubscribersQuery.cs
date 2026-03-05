using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventSubscribersQuery(int EventId) : IRequest<IEnumerable<EventSubscription>>;
