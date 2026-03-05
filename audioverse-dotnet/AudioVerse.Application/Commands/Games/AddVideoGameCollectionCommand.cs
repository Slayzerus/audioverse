using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameCollectionCommand(VideoGameCollection Collection) : IRequest<int>;
}
