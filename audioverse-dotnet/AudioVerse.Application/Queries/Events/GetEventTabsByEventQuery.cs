using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetEventTabsByEventQuery(int EventId) : IRequest<IEnumerable<EventTab>>;
}
