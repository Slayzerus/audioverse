using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetEventByEventIdQuery(int EventId) : IRequest<Event?>;
}
