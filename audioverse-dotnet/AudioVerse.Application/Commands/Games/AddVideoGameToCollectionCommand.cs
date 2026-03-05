using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Commands.Games
{
    public record AddVideoGameToCollectionCommand(VideoGameCollectionVideoGame Item) : IRequest<int>;
}
