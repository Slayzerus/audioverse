using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record RemoveBoardGameFromCollectionCommand(int Id) : IRequest<bool>;
}
