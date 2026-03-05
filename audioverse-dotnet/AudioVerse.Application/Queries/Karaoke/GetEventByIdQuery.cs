using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetEventByIdQuery(int EventId) : IRequest<Event?>;
}
