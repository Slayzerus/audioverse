namespace AudioVerse.Domain.Entities.Wishlists;

/// <summary>
/// Lista prezentowa na event (np. wesele, urodziny). Powiązana z Event.
/// Pozwala wielu osobom dołożyć się do jednego prezentu.
/// </summary>
public class GiftRegistry
{
    public int Id { get; set; }

    /// <summary>ID eventu (wesele, urodziny itp.).</summary>
    public int? EventId { get; set; }

    /// <summary>ID użytkownika — właściciel listy prezentowej.</summary>
    public int OwnerUserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Publiczny token do udostępniania gościom.</summary>
    public string ShareToken { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Czy lista jest aktywna (można rezerwować).</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<GiftRegistryItem> Items { get; set; } = new List<GiftRegistryItem>();
}
