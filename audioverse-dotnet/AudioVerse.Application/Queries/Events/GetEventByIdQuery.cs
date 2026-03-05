using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Queries.Events
{
    public record GetEventByIdQuery(int EventId) : IRequest<Event?>;
}
