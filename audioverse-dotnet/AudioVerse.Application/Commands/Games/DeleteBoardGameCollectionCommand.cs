using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteBoardGameCollectionCommand(int Id) : IRequest<bool>;
}
