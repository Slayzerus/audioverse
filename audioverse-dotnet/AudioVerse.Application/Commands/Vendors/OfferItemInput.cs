namespace AudioVerse.Application.Commands.Vendors;

/// <summary>
/// Offer line item input DTO.
/// </summary>
public record OfferItemInput(
    string Name, string? Description, int? PriceListItemId, int? MenuItemId,
    int Quantity, decimal UnitPrice, string? Notes, int SortOrder);
