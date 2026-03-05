using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Dodaj pozycję do menu vendora (catering).</summary>
/// <summary>
/// Add a menu item to a vendor.
/// </summary>
public record AddVendorMenuItemCommand(
    int VendorProfileId, int OwnerUserId,
    string Name, string? Description, string? Category,
    decimal? Price, string? Currency, string? ImageUrl, string? Allergens,
    bool IsVegetarian, bool IsVegan, bool IsGlutenFree, int SortOrder)
    : IRequest<VendorMenuItem?>;
