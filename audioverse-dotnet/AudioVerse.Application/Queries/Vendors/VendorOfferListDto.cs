namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Vendor offer list item DTO (for owner or client).
/// </summary>
public record VendorOfferListDto(int Id, string Title, decimal TotalPrice, string Currency, string Status, int? ClientUserId, int? EventId, DateTime? ValidUntil, DateTime CreatedAtUtc);
