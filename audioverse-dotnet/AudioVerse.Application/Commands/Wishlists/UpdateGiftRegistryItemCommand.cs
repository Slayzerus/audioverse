using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Update a gift registry item.</summary>
public record UpdateGiftRegistryItemCommand(int RegistryId, int ItemId, int OwnerUserId, string Name, string? Description,
    string? ImageUrl, string? ExternalUrl, decimal? TargetAmount, string? Currency, int? MaxContributors, int SortOrder)
    : IRequest<GiftRegistryItem?>;
