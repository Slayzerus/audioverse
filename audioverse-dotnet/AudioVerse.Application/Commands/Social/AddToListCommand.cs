using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.Social;

/// <summary>Add an entity to a user's personal list.</summary>
public record AddToListCommand(
    RateableEntityType EntityType,
    int EntityId,
    int PlayerId,
    string ListName,
    string? Note
) : IRequest<int>;
