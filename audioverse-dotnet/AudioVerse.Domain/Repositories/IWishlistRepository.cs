using AudioVerse.Domain.Entities.Wishlists;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for wishlists, wishlist items, gift registries, gift items, and contributions.
/// </summary>
public interface IWishlistRepository
{
    Task SaveChangesAsync(CancellationToken ct = default);

    // ── Wishlists ──
    Task<Wishlist> AddWishlistAsync(Wishlist wishlist, CancellationToken ct = default);
    Task<Wishlist?> GetWishlistByIdAsync(int id, CancellationToken ct = default);
    Task<Wishlist?> GetWishlistWithItemsAsync(int id, CancellationToken ct = default);
    Task<Wishlist?> GetWishlistByTokenAsync(string token, CancellationToken ct = default);
    Task<IEnumerable<Wishlist>> GetWishlistsByUserAsync(int userId, CancellationToken ct = default);
    Task RemoveWishlistAsync(Wishlist wishlist, CancellationToken ct = default);

    // ── Wishlist Items ──
    Task<WishlistItem> AddWishlistItemAsync(WishlistItem item, CancellationToken ct = default);
    Task<WishlistItem?> GetWishlistItemAsync(int itemId, int wishlistId, CancellationToken ct = default);
    Task RemoveWishlistItemAsync(WishlistItem item, CancellationToken ct = default);

    // ── Gift Registries ──
    Task<GiftRegistry> AddGiftRegistryAsync(GiftRegistry registry, CancellationToken ct = default);
    Task<GiftRegistry?> GetGiftRegistryByIdAsync(int id, CancellationToken ct = default);
    Task<GiftRegistry?> GetGiftRegistryWithItemsAsync(int id, CancellationToken ct = default);
    Task<GiftRegistry?> GetGiftRegistryByTokenAsync(string token, CancellationToken ct = default);
    Task<IEnumerable<GiftRegistry>> GetGiftRegistriesByUserAsync(int userId, CancellationToken ct = default);
    Task RemoveGiftRegistryAsync(GiftRegistry registry, CancellationToken ct = default);

    // ── Gift Registry Items ──
    Task<GiftRegistryItem> AddGiftRegistryItemAsync(GiftRegistryItem item, CancellationToken ct = default);
    Task<GiftRegistryItem?> GetGiftRegistryItemAsync(int itemId, int registryId, CancellationToken ct = default);
    Task<GiftRegistryItem?> GetGiftRegistryItemWithContributionsAsync(int itemId, CancellationToken ct = default);
    Task RemoveGiftRegistryItemAsync(GiftRegistryItem item, CancellationToken ct = default);

    // ── Contributions ──
    Task<GiftContribution> AddContributionAsync(GiftContribution contribution, CancellationToken ct = default);
    Task<GiftContribution?> GetContributionByIdAsync(int id, CancellationToken ct = default);
    Task RemoveContributionAsync(GiftContribution contribution, CancellationToken ct = default);
}
