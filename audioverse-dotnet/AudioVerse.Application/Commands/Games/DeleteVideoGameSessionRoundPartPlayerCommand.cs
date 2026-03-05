using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameSessionRoundPartPlayerCommand(int Id) : IRequest<bool>;
}
