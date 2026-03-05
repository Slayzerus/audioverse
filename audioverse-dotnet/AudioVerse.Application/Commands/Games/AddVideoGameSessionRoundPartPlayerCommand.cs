using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameSessionRoundPartPlayerCommand(VideoGameSessionRoundPartPlayer Player) : IRequest<int>;
}
