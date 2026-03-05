using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetBoardGameSessionByIdQuery(int Id) : IRequest<BoardGameSession?>;
}
