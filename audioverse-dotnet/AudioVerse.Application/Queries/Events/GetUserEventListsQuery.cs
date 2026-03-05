using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetUserEventListsQuery(int UserId) : IRequest<IEnumerable<EventList>>;
