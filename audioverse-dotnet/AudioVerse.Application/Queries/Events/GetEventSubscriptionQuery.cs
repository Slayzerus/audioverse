using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventSubscriptionQuery(int UserId, int EventId) : IRequest<EventSubscription?>;
