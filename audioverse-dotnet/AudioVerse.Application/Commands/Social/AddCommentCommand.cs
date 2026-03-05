using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Add a comment to an entity.</summary>
public record AddCommentCommand(
    RateableEntityType EntityType,
    int EntityId,
    int PlayerId,
    string Content,
    int? ParentCommentId,
    bool ContainsSpoilers
) : IRequest<int>;
