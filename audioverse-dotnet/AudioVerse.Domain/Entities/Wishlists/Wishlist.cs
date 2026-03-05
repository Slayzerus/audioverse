namespace AudioVerse.Domain.Entities.Wishlists;

/// <summary>
/// Wishlist użytkownika — lista życzeń (gry, filmy, książki, muzyka, custom).
/// Może być prywatna lub publiczna. Może być synchronizowana z zewnętrznym źródłem (np. Steam).
/// </summary>
public class Wishlist
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }

    /// <summary>Nazwa wishlisty (np. "Gry do kupienia", "Na urodziny").</summary>
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Czy widoczna publicznie (link do udostępnienia).</summary>
    public bool IsPublic { get; set; }

    /// <summary>Unikalny token do publicznego udostępniania (UUID).</summary>
    public string ShareToken { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Zewnętrzne źródło synchronizacji (np. "steam").</summary>
    public string? SyncSource { get; set; }

    /// <summary>ID konta zewnętrznego użyte do synchronizacji (np. SteamId).</summary>
    public string? SyncExternalId { get; set; }

    /// <summary>Data ostatniej synchronizacji.</summary>
    public DateTime? LastSyncUtc { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<WishlistItem> Items { get; set; } = new List<WishlistItem>();
}
