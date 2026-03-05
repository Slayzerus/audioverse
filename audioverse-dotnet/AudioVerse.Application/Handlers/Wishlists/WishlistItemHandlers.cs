using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Wishlists;

public class WishlistItemHandlers(IWishlistRepository repo)
    : IRequestHandler<AddWishlistItemCommand, WishlistItem?>,
      IRequestHandler<UpdateWishlistItemCommand, WishlistItem?>,
      IRequestHandler<ToggleAcquiredCommand, (int Id, bool IsAcquired)?>,
      IRequestHandler<DeleteWishlistItemCommand, bool>
{
    private async Task<bool> IsOwner(int wishlistId, int userId, CancellationToken ct)
    {
        var w = await repo.GetWishlistByIdAsync(wishlistId, ct);
        return w?.OwnerUserId == userId;
    }

    public async Task<WishlistItem?> Handle(AddWishlistItemCommand req, CancellationToken ct)
    {
        if (!await IsOwner(req.WishlistId, req.OwnerUserId, ct)) return null;
        var item = new WishlistItem
        {
            WishlistId = req.WishlistId, ItemType = req.ItemType, Name = req.Name,
            Description = req.Description, ImageUrl = req.ImageUrl, ExternalUrl = req.ExternalUrl,
            EstimatedPrice = req.EstimatedPrice, Currency = req.Currency, Priority = req.Priority,
            SortOrder = req.SortOrder, BoardGameId = req.BoardGameId, VideoGameId = req.VideoGameId,
            SteamAppId = req.SteamAppId, BggId = req.BggId, Notes = req.Notes
        };
        return await repo.AddWishlistItemAsync(item, ct);
    }

    public async Task<WishlistItem?> Handle(UpdateWishlistItemCommand req, CancellationToken ct)
    {
        var item = await repo.GetWishlistItemAsync(req.ItemId, req.WishlistId, ct);
        if (item == null || item.Wishlist?.OwnerUserId != req.OwnerUserId) return null;
        item.Name = req.Name; item.Description = req.Description; item.ImageUrl = req.ImageUrl;
        item.ExternalUrl = req.ExternalUrl; item.EstimatedPrice = req.EstimatedPrice;
        item.Currency = req.Currency; item.Priority = req.Priority; item.SortOrder = req.SortOrder;
        item.BoardGameId = req.BoardGameId; item.VideoGameId = req.VideoGameId;
        item.SteamAppId = req.SteamAppId; item.BggId = req.BggId; item.Notes = req.Notes; item.IsAcquired = req.IsAcquired;
        await repo.SaveChangesAsync(ct);
        return item;
    }

    public async Task<(int Id, bool IsAcquired)?> Handle(ToggleAcquiredCommand req, CancellationToken ct)
    {
        var item = await repo.GetWishlistItemAsync(req.ItemId, req.WishlistId, ct);
        if (item == null || item.Wishlist?.OwnerUserId != req.OwnerUserId) return null;
        item.IsAcquired = !item.IsAcquired;
        await repo.SaveChangesAsync(ct);
        return (item.Id, item.IsAcquired);
    }

    public async Task<bool> Handle(DeleteWishlistItemCommand req, CancellationToken ct)
    {
        var item = await repo.GetWishlistItemAsync(req.ItemId, req.WishlistId, ct);
        if (item == null || item.Wishlist?.OwnerUserId != req.OwnerUserId) return false;
        await repo.RemoveWishlistItemAsync(item, ct);
        return true;
    }
}
