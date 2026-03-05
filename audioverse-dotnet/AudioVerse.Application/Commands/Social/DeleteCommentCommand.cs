using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Delete (soft) a comment.</summary>
public record DeleteCommentCommand(int CommentId, int PlayerId) : IRequest<bool>;
