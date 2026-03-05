using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles retrieving ratings for an entity.</summary>
public class GetRatingsHandler(ISocialRepository socialRepository)
    : IRequestHandler<GetRatingsQuery, GetRatingsResult>
{
    public async Task<GetRatingsResult> Handle(GetRatingsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await socialRepository.GetRatingsAsync(
            request.EntityType, request.EntityId, request.Page, request.PageSize);
        return new GetRatingsResult(items, total);
    }
}
