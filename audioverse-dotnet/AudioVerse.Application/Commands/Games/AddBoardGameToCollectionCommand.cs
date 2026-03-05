using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddBoardGameToCollectionCommand(BoardGameCollectionBoardGame Item) : IRequest<int>;
}
