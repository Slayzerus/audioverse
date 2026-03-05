using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameSessionRoundPartCommand(int Id) : IRequest<bool>;
}
