using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record DeleteVideoGameSessionPlayerCommand(int Id) : IRequest<bool>;
}
