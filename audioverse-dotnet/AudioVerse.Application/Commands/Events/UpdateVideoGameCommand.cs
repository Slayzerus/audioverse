using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateVideoGameCommand(VideoGame Game) : IRequest<bool>;
}
