using AudioVerse.Application.Commands.Social;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Social;

/// <summary>Handles updating a comment's content.</summary>
public class UpdateCommentHandler(ISocialRepository socialRepository)
    : IRequestHandler<UpdateCommentCommand, bool>
{
    public async Task<bool> Handle(UpdateCommentCommand request, CancellationToken cancellationToken)
    {
        return await socialRepository.UpdateCommentAsync(request.CommentId, request.PlayerId, request.Content);
    }
}
