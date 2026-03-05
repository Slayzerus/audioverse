using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameSessionCommand(int Id) : IRequest<bool>;
}
