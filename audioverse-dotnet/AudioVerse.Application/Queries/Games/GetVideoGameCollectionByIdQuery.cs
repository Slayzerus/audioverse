using AudioVerse.Domain.Entities.Games;
using MediatR;

namespace AudioVerse.Application.Queries.Games
{
    public record GetVideoGameCollectionByIdQuery(int Id, bool IncludeChildren = false, int MaxDepth = 1) : IRequest<VideoGameCollection?>;
}
