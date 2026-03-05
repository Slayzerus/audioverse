using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameSessionRoundPartCommand(BoardGameSessionRoundPart Part) : IRequest<int>;
}
