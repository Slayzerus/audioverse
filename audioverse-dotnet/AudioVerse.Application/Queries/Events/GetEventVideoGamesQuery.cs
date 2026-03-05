using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetEventVideoGamesQuery(int EventId) : IRequest<IEnumerable<EventVideoGameSession>>;
}
