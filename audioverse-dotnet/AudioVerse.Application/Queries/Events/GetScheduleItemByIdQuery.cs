using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetScheduleItemByIdQuery(int Id) : IRequest<EventScheduleItem?>;
}
