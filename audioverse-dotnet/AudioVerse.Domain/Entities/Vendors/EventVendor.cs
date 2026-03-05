namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Powiązanie vendora z eventem — vendor obsługuje dany aspekt eventu (catering, sala, DJ…).
/// Pozwala na porównywanie ofert od różnych vendorów dla tego samego eventu.
/// </summary>
public class EventVendor
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int VendorProfileId { get; set; }

    /// <summary>Rola vendora w evencie (jaki aspekt obsługuje).</summary>
    public VendorServiceCategory ServiceCategory { get; set; }

    /// <summary>FK do zaakceptowanej oferty (opcjonalny — null = jeszcze nie wybrano).</summary>
    public int? AcceptedOfferId { get; set; }

    /// <summary>Status współpracy.</summary>
    public EventVendorStatus Status { get; set; } = EventVendorStatus.Invited;

    /// <summary>Notatki organizatora.</summary>
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
