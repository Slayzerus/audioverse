using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Aktualizuj profil vendora.</summary>
/// <summary>
/// Update a vendor profile.
/// </summary>
public record UpdateVendorProfileCommand(
    int VendorProfileId, int OwnerUserId, string Slug, string? ShortDescription, string? FullDescription,
    VendorServiceCategory PrimaryCategory, string? AdditionalCategories,
    string? Phone, string? Email, string? Website, string? CoverImageUrl,
    string? City, string? Region, string? CountryCode, double? Latitude, double? Longitude, int? ServiceRadiusKm)
    : IRequest<VendorProfile?>;
