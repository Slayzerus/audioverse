using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameCollectionCommand(int Id) : IRequest<bool>;
}
