using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to add a price list item.</summary>
public record PriceListItemRequest(string Name, string? Description, VendorServiceCategory Category,
    decimal Price, decimal? PriceFrom, decimal? PriceTo, string? Currency, string? PriceUnit,
    int? MinQuantity, string? ImageUrl, int SortOrder = 0, bool IsAvailable = true);
