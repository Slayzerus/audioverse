using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles upserting a user rating.</summary>
public class UpsertRatingHandler(ISocialRepository socialRepository)
    : IRequestHandler<UpsertRatingCommand, int>
{
    public async Task<int> Handle(UpsertRatingCommand r, CancellationToken cancellationToken)
    {
        var rating = new UserRating
        {
            EntityType = r.EntityType,
            EntityId = r.EntityId,
            PlayerId = r.PlayerId,
            OverallScore = Math.Clamp(r.OverallScore, 1, 10),
            Criterion1 = r.Criterion1,
            Criterion1Score = r.Criterion1Score.HasValue ? Math.Clamp(r.Criterion1Score.Value, 1, 10) : null,
            Criterion2 = r.Criterion2,
            Criterion2Score = r.Criterion2Score.HasValue ? Math.Clamp(r.Criterion2Score.Value, 1, 10) : null,
            Criterion3 = r.Criterion3,
            Criterion3Score = r.Criterion3Score.HasValue ? Math.Clamp(r.Criterion3Score.Value, 1, 10) : null,
            ReviewText = r.ReviewText,
            ContainsSpoilers = r.ContainsSpoilers
        };

        var result = await socialRepository.UpsertRatingAsync(rating);
        return result.Id;
    }
}
