using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles toggling a reaction on a comment.</summary>
public class ToggleCommentReactionHandler(ISocialRepository socialRepository)
    : IRequestHandler<ToggleCommentReactionCommand, bool>
{
    public async Task<bool> Handle(ToggleCommentReactionCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.ToggleCommentReactionAsync(request.CommentId, request.PlayerId, request.ReactionType);
    }
}
