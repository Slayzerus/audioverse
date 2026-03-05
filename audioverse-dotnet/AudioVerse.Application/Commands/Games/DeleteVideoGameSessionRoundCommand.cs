using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameSessionRoundCommand(int Id) : IRequest<bool>;
}
