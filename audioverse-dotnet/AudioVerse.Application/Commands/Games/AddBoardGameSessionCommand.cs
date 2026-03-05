using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameSessionCommand(BoardGameSession Session) : IRequest<int>;
}
