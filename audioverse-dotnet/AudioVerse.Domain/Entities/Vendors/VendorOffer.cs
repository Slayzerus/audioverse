namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Oferta vendora przygotowana dla klienta — spersonalizowany cennik/pakiet.
/// </summary>
public class VendorOffer
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }

    /// <summary>FK do zapytania na które odpowiada oferta.</summary>
    public int? InquiryId { get; set; }

    /// <summary>ID klienta / użytkownika dla którego oferta.</summary>
    public int? ClientUserId { get; set; }

    /// <summary>ID eventu (opcjonalny).</summary>
    public int? EventId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Łączna cena oferty.</summary>
    public decimal TotalPrice { get; set; }

    public string Currency { get; set; } = "PLN";

    /// <summary>Ważność oferty do.</summary>
    public DateTime? ValidUntil { get; set; }

    public VendorOfferStatus Status { get; set; } = VendorOfferStatus.Draft;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<VendorOfferItem> Items { get; set; } = new List<VendorOfferItem>();
}
