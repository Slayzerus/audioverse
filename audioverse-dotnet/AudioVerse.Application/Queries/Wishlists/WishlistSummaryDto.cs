namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>
/// Wishlist summary DTO (for user's wishlist list).
/// </summary>
public record WishlistSummaryDto(int Id, string Name, string? Description, bool IsPublic, string ShareToken, string? SyncSource, DateTime? LastSyncUtc, int ItemCount);
