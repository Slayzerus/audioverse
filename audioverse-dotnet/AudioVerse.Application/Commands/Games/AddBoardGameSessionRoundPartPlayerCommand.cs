using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameSessionRoundPartPlayerCommand(BoardGameSessionRoundPartPlayer Player) : IRequest<int>;
}
