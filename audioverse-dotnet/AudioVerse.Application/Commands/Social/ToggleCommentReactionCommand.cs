using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Toggle a reaction on a comment (add if missing, remove if exists).</summary>
public record ToggleCommentReactionCommand(int CommentId, int PlayerId, string ReactionType) : IRequest<bool>;
