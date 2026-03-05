namespace AudioVerse.Domain.Entities.Wishlists;

/// <summary>
/// Element na wishliście — może być grą planszową, video, filmem, książką lub czymkolwiek (custom).
/// </summary>
public class WishlistItem
{
    public int Id { get; set; }
    public int WishlistId { get; set; }
    public Wishlist? Wishlist { get; set; }

    public WishlistItemType ItemType { get; set; }

    /// <summary>Nazwa elementu (np. "Gloomhaven", "Elden Ring").</summary>
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>URL obrazka / okładki.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>URL do strony produktu (sklep, BGG, Steam, itp.).</summary>
    public string? ExternalUrl { get; set; }

    /// <summary>Szacowana cena (opcjonalna).</summary>
    public decimal? EstimatedPrice { get; set; }

    /// <summary>Waluta ceny (PLN, EUR, USD…).</summary>
    public string? Currency { get; set; }

    public WishlistPriority Priority { get; set; } = WishlistPriority.Normal;

    /// <summary>Kolejność wyświetlania.</summary>
    public int SortOrder { get; set; }

    // ── Powiązania z istniejącymi encjami ──

    /// <summary>ID gry planszowej (jeśli ItemType == BoardGame).</summary>
    public int? BoardGameId { get; set; }

    /// <summary>ID gry video (jeśli ItemType == VideoGame).</summary>
    public int? VideoGameId { get; set; }

    /// <summary>Steam App ID (synchronizacja ze Steam wishlistą).</summary>
    public int? SteamAppId { get; set; }

    /// <summary>BGG ID (BoardGameGeek).</summary>
    public int? BggId { get; set; }

    /// <summary>Czy element został już kupiony / zdobyty.</summary>
    public bool IsAcquired { get; set; }

    /// <summary>Notatki prywatne właściciela.</summary>
    public string? Notes { get; set; }

    public DateTime AddedAtUtc { get; set; } = DateTime.UtcNow;
}
