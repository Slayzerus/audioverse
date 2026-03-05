using AudioVerse.Domain.Entities.Wishlists;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class WishlistRepositoryEF(AudioVerseDbContext db) : IWishlistRepository
{
    public async Task SaveChangesAsync(CancellationToken ct = default) => await db.SaveChangesAsync(ct);

    // ── Wishlists ──

    public async Task<Wishlist> AddWishlistAsync(Wishlist wishlist, CancellationToken ct = default)
    {
        db.Wishlists.Add(wishlist);
        await db.SaveChangesAsync(ct);
        return wishlist;
    }

    public async Task<Wishlist?> GetWishlistByIdAsync(int id, CancellationToken ct = default)
        => await db.Wishlists.FindAsync(new object[] { id }, ct);

    public async Task<Wishlist?> GetWishlistWithItemsAsync(int id, CancellationToken ct = default)
        => await db.Wishlists.Include(w => w.Items.OrderBy(i => i.SortOrder)).FirstOrDefaultAsync(w => w.Id == id, ct);

    public async Task<Wishlist?> GetWishlistByTokenAsync(string token, CancellationToken ct = default)
        => await db.Wishlists.Include(w => w.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(w => w.ShareToken == token && w.IsPublic, ct);

    public async Task<IEnumerable<Wishlist>> GetWishlistsByUserAsync(int userId, CancellationToken ct = default)
        => await db.Wishlists.Where(w => w.OwnerUserId == userId).Include(w => w.Items).ToListAsync(ct);

    public async Task RemoveWishlistAsync(Wishlist wishlist, CancellationToken ct = default)
    {
        db.Wishlists.Remove(wishlist);
        await db.SaveChangesAsync(ct);
    }

    // ── Wishlist Items ──

    public async Task<WishlistItem> AddWishlistItemAsync(WishlistItem item, CancellationToken ct = default)
    {
        db.WishlistItems.Add(item);
        await db.SaveChangesAsync(ct);
        return item;
    }

    public async Task<WishlistItem?> GetWishlistItemAsync(int itemId, int wishlistId, CancellationToken ct = default)
        => await db.WishlistItems.Include(i => i.Wishlist)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.WishlistId == wishlistId, ct);

    public async Task RemoveWishlistItemAsync(WishlistItem item, CancellationToken ct = default)
    {
        db.WishlistItems.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    // ── Gift Registries ──

    public async Task<GiftRegistry> AddGiftRegistryAsync(GiftRegistry registry, CancellationToken ct = default)
    {
        db.GiftRegistries.Add(registry);
        await db.SaveChangesAsync(ct);
        return registry;
    }

    public async Task<GiftRegistry?> GetGiftRegistryByIdAsync(int id, CancellationToken ct = default)
        => await db.GiftRegistries.FindAsync(new object[] { id }, ct);

    public async Task<GiftRegistry?> GetGiftRegistryWithItemsAsync(int id, CancellationToken ct = default)
        => await db.GiftRegistries
            .Include(g => g.Items).ThenInclude(i => i.Contributions)
            .FirstOrDefaultAsync(g => g.Id == id, ct);

    public async Task<GiftRegistry?> GetGiftRegistryByTokenAsync(string token, CancellationToken ct = default)
        => await db.GiftRegistries
            .Include(g => g.Items.OrderBy(i => i.SortOrder)).ThenInclude(i => i.Contributions)
            .FirstOrDefaultAsync(g => g.ShareToken == token && g.IsActive, ct);

    public async Task<IEnumerable<GiftRegistry>> GetGiftRegistriesByUserAsync(int userId, CancellationToken ct = default)
        => await db.GiftRegistries.Where(g => g.OwnerUserId == userId).Include(g => g.Items).ToListAsync(ct);

    public async Task RemoveGiftRegistryAsync(GiftRegistry registry, CancellationToken ct = default)
    {
        db.GiftRegistries.Remove(registry);
        await db.SaveChangesAsync(ct);
    }

    // ── Gift Registry Items ──

    public async Task<GiftRegistryItem> AddGiftRegistryItemAsync(GiftRegistryItem item, CancellationToken ct = default)
    {
        db.GiftRegistryItems.Add(item);
        await db.SaveChangesAsync(ct);
        return item;
    }

    public async Task<GiftRegistryItem?> GetGiftRegistryItemAsync(int itemId, int registryId, CancellationToken ct = default)
        => await db.GiftRegistryItems.Include(i => i.GiftRegistry)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.GiftRegistryId == registryId, ct);

    public async Task<GiftRegistryItem?> GetGiftRegistryItemWithContributionsAsync(int itemId, CancellationToken ct = default)
        => await db.GiftRegistryItems.Include(i => i.Contributions).Include(i => i.GiftRegistry)
            .FirstOrDefaultAsync(i => i.Id == itemId, ct);

    public async Task RemoveGiftRegistryItemAsync(GiftRegistryItem item, CancellationToken ct = default)
    {
        db.GiftRegistryItems.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    // ── Contributions ──

    public async Task<GiftContribution> AddContributionAsync(GiftContribution contribution, CancellationToken ct = default)
    {
        db.GiftContributions.Add(contribution);
        await db.SaveChangesAsync(ct);
        return contribution;
    }

    public async Task<GiftContribution?> GetContributionByIdAsync(int id, CancellationToken ct = default)
        => await db.GiftContributions.Include(c => c.GiftRegistryItem).FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task RemoveContributionAsync(GiftContribution contribution, CancellationToken ct = default)
    {
        db.GiftContributions.Remove(contribution);
        await db.SaveChangesAsync(ct);
    }
}
