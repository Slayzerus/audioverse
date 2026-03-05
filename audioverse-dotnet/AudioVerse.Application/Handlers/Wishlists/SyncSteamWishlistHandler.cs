using AudioVerse.Application.Commands.Wishlists;
using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.ExternalApis.Steam;
using MediatR;

namespace AudioVerse.Application.Handlers.Wishlists;

public class SyncSteamWishlistHandler(IWishlistRepository repo, ISteamClient steam) : IRequestHandler<SyncSteamWishlistCommand, (int Imported, int Total)>
{
    public async Task<(int Imported, int Total)> Handle(SyncSteamWishlistCommand req, CancellationToken ct)
    {
        var w = await repo.GetWishlistWithItemsAsync(req.WishlistId, ct)
            ?? throw new InvalidOperationException("Wishlist not found");
        if (w.OwnerUserId != req.OwnerUserId) throw new UnauthorizedAccessException();

        var steamItems = await steam.GetWishlistAsync(req.SteamId, ct);
        if (steamItems == null || steamItems.Count == 0) return (0, w.Items.Count);

        int imported = 0;
        foreach (var si in steamItems)
        {
            if (w.Items.Any(i => i.SteamAppId == si.AppId)) continue;
            w.Items.Add(new WishlistItem
            {
                WishlistId = w.Id, ItemType = WishlistItemType.VideoGame,
                Name = si.Name, ImageUrl = si.CapsuleUrl,
                ExternalUrl = $"https://store.steampowered.com/app/{si.AppId}",
                SteamAppId = si.AppId,
                Priority = si.Priority <= 1 ? WishlistPriority.MustHave
                         : si.Priority <= 5 ? WishlistPriority.High
                         : si.Priority <= 15 ? WishlistPriority.Normal
                         : WishlistPriority.Low,
                SortOrder = si.Priority, AddedAtUtc = si.AddedAtUtc
            });
            imported++;
        }
        w.SyncSource = "steam"; w.SyncExternalId = req.SteamId; w.LastSyncUtc = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return (imported, w.Items.Count);
    }
}
