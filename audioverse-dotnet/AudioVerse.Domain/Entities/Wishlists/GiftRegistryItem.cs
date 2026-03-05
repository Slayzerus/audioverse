namespace AudioVerse.Domain.Entities.Wishlists;

/// <summary>
/// Element na liście prezentowej. Może mieć wielu kontrybutorów (wspólny prezent).
/// </summary>
public class GiftRegistryItem
{
    public int Id { get; set; }
    public int GiftRegistryId { get; set; }
    public GiftRegistry? GiftRegistry { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? ExternalUrl { get; set; }

    /// <summary>Docelowa kwota prezentu (opcjonalna).</summary>
    public decimal? TargetAmount { get; set; }

    /// <summary>Waluta (PLN, EUR, USD…).</summary>
    public string? Currency { get; set; }

    /// <summary>Ile osób może się dołożyć (null = bez limitu).</summary>
    public int? MaxContributors { get; set; }

    /// <summary>Czy prezent jest w pełni zarezerwowany/sfinansowany.</summary>
    public bool IsFullyReserved { get; set; }

    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GiftContribution> Contributions { get; set; } = new List<GiftContribution>();
}
