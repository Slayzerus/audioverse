using AudioVerse.Domain.Entities.Social;
using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Queries.Social;

/// <summary>Get a player's personal list entries.</summary>
public record GetPlayerListQuery(
    int PlayerId,
    string ListName,
    RateableEntityType? EntityType
) : IRequest<IEnumerable<UserListEntry>>;
