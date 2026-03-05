using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles retrieving rating aggregate for an entity.</summary>
public class GetRatingAggregateHandler(ISocialRepository socialRepository)
    : IRequestHandler<GetRatingAggregateQuery, RatingAggregate>
{
    public async Task<RatingAggregate> Handle(GetRatingAggregateQuery request, CancellationToken cancellationToken)
    {
        return await socialRepository.GetRatingAggregateAsync(request.EntityType, request.EntityId);
    }
}
