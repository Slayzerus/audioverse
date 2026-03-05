using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record RemoveVideoGameFromCollectionCommand(int Id) : IRequest<bool>;
}
