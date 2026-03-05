namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Wishlist item from Steam Store.
/// </summary>
public class SteamWishlistItem
{
    public int AppId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Priority { get; set; }
    public long DateAdded { get; set; }
    public string? CapsuleUrl { get; set; }
    public bool IsFreeToPlay { get; set; }

    public DateTime AddedAtUtc => DateTimeOffset.FromUnixTimeSeconds(DateAdded).UtcDateTime;
}
