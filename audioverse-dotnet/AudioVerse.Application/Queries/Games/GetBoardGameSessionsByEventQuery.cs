using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetBoardGameSessionsByEventQuery(int EventId) : IRequest<IEnumerable<BoardGameSession>>;
}
