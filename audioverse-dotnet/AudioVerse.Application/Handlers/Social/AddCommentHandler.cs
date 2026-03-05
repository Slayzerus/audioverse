using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles adding a comment to an entity.</summary>
public class AddCommentHandler(ISocialRepository socialRepository)
    : IRequestHandler<AddCommentCommand, int>
{
    public async Task<int> Handle(AddCommentCommand request, CancellationToken cancellationToken)
    {
        var comment = new UserComment
        {
            EntityType = request.EntityType,
            EntityId = request.EntityId,
            PlayerId = request.PlayerId,
            Content = request.Content,
            ParentCommentId = request.ParentCommentId,
            ContainsSpoilers = request.ContainsSpoilers
        };

        var result = await socialRepository.AddCommentAsync(comment);
        return result.Id;
    }
}
