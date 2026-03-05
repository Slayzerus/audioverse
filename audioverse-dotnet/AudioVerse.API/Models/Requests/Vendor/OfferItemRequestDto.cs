using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Offer line item.</summary>
public record OfferItemRequestDto(string Name, string? Description, int? PriceListItemId, int? MenuItemId,
    int Quantity, decimal UnitPrice, string? Notes, int SortOrder = 0);
