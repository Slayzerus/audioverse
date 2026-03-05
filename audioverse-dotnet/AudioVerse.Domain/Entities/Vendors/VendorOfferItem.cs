namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Pozycja w ofercie vendora (linia ofertowa).
/// </summary>
public class VendorOfferItem
{
    public int Id { get; set; }
    public int VendorOfferId { get; set; }
    public VendorOffer? VendorOffer { get; set; }

    /// <summary>FK do pozycji z cennika (opcjonalny — oferta może mieć pozycje niestandardowe).</summary>
    public int? PriceListItemId { get; set; }

    /// <summary>FK do pozycji menu (opcjonalny).</summary>
    public int? MenuItemId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public string? Notes { get; set; }
    public int SortOrder { get; set; }
}
