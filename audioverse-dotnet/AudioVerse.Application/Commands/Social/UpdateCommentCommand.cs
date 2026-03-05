using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Update a comment's content.</summary>
public record UpdateCommentCommand(int CommentId, int PlayerId, string Content) : IRequest<bool>;
