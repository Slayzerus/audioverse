using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameSessionRoundCommand(BoardGameSessionRound Round) : IRequest<int>;
}
