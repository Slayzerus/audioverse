using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Add a tag to an entity (idempotent).</summary>
public record AddTagCommand(
    RateableEntityType EntityType,
    int EntityId,
    int PlayerId,
    string Tag
) : IRequest<int>;
