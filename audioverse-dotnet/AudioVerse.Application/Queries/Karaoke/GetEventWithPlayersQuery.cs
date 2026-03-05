using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetEventWithPlayersQuery(int EventId) : IRequest<Event?>;
}
