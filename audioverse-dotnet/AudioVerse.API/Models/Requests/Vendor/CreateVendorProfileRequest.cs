using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to create a vendor profile.</summary>
public record CreateVendorProfileRequest(int OrganizationId, string Slug, string? ShortDescription, string? FullDescription,
    VendorServiceCategory PrimaryCategory, string? AdditionalCategories,
    string? Phone, string? Email, string? Website, string? CoverImageUrl,
    string? City, string? Region, string? CountryCode, double? Latitude, double? Longitude, int? ServiceRadiusKm);
