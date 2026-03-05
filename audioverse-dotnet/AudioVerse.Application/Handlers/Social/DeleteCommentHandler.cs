using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles deleting (soft) a comment.</summary>
public class DeleteCommentHandler(ISocialRepository socialRepository)
    : IRequestHandler<DeleteCommentCommand, bool>
{
    public async Task<bool> Handle(DeleteCommentCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.DeleteCommentAsync(request.CommentId, request.PlayerId);
    }
}
