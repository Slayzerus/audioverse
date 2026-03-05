using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events
{
    public record GetEventBoardGamesQuery(int EventId) : IRequest<IEnumerable<EventBoardGameSession>>;
}
