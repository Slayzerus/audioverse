using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameSessionCommand(VideoGameSession Session) : IRequest<int>;
}
