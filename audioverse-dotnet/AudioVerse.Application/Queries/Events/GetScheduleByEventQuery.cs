using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetScheduleByEventQuery(int EventId) : IRequest<IEnumerable<EventScheduleItem>>;
}
