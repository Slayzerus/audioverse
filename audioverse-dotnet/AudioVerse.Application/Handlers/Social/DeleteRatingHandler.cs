using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles deleting a user rating.</summary>
public class DeleteRatingHandler(ISocialRepository socialRepository)
    : IRequestHandler<DeleteRatingCommand, bool>
{
    public async Task<bool> Handle(DeleteRatingCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.DeleteRatingAsync(request.RatingId, request.PlayerId);
    }
}
