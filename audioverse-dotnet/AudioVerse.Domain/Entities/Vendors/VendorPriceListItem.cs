namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Cennik vendora — element na liście usług z ceną.
/// </summary>
public class VendorPriceListItem
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }

    /// <summary>Nazwa usługi / produktu (np. "Obiad 3-daniowy", "Sala na 100 osób").</summary>
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Kategoria (jedzenie, sala, atrakcja…).</summary>
    public VendorServiceCategory Category { get; set; }

    /// <summary>Cena bazowa.</summary>
    public decimal Price { get; set; }

    /// <summary>Cena "od" (zakres cenowy).</summary>
    public decimal? PriceFrom { get; set; }

    /// <summary>Cena "do" (opcjonalna górna granica).</summary>
    public decimal? PriceTo { get; set; }

    /// <summary>Waluta (PLN, EUR…).</summary>
    public string Currency { get; set; } = "PLN";

    /// <summary>Jednostka cenowa (os., szt., godz., event…).</summary>
    public string? PriceUnit { get; set; }

    /// <summary>Minimalna liczba zamówienia (np. 50 osób).</summary>
    public int? MinQuantity { get; set; }

    /// <summary>URL zdjęcia.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Czy pozycja jest dostępna.</summary>
    public bool IsAvailable { get; set; } = true;

    public int SortOrder { get; set; }
}
