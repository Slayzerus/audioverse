using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Delete (soft) a rating.</summary>
public record DeleteRatingCommand(int RatingId, int PlayerId) : IRequest<bool>;
