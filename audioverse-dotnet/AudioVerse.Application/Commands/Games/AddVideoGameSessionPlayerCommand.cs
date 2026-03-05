using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameSessionPlayerCommand(VideoGameSessionPlayer Player) : IRequest<int>;
}
