using AudioVerse.Domain.Entities.Wishlists;
using MediatR;

namespace AudioVerse.Application.Commands.Wishlists;

/// <summary>Add an item to a gift registry.</summary>
public record AddGiftRegistryItemCommand(int RegistryId, int OwnerUserId, string Name, string? Description,
    string? ImageUrl, string? ExternalUrl, decimal? TargetAmount, string? Currency, int? MaxContributors, int SortOrder)
    : IRequest<GiftRegistryItem?>;
