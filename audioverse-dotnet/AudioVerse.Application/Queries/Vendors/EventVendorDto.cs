namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Event-vendor association DTO (for offer comparison).
/// </summary>
public record EventVendorDto(
    int Id, int EventId, int VendorProfileId, string OrganizationName,
    string ServiceCategory, string Status, int? AcceptedOfferId, string? Notes,
    string? VendorSlug, string? VendorCity, double VendorRating, bool VendorVerified);
