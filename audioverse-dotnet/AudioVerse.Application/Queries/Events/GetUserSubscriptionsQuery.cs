using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetUserSubscriptionsQuery(int UserId) : IRequest<IEnumerable<EventSubscription>>;
