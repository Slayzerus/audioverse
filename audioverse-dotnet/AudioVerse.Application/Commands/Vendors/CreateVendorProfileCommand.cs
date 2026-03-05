using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Utwórz profil vendora dla organizacji.</summary>
/// <summary>
/// Create a vendor profile for an organization in the marketplace.
/// </summary>
public record CreateVendorProfileCommand(
    int OrganizationId, int OwnerUserId, string Slug, string? ShortDescription, string? FullDescription,
    VendorServiceCategory PrimaryCategory, string? AdditionalCategories,
    string? Phone, string? Email, string? Website, string? CoverImageUrl,
    string? City, string? Region, string? CountryCode, double? Latitude, double? Longitude, int? ServiceRadiusKm)
    : IRequest<VendorProfile>;
