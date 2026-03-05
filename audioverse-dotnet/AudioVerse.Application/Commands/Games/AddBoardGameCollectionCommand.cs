using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameCollectionCommand(BoardGameCollection Collection) : IRequest<int>;
}
