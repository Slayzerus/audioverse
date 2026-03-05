using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddVideoGameCommand(VideoGame Game) : IRequest<int>;
}
