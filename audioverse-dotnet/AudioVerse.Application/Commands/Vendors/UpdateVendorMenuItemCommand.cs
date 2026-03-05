using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Aktualizuj pozycję menu vendora.</summary>
/// <summary>
/// Update a vendor menu item.
/// </summary>
public record UpdateVendorMenuItemCommand(
    int VendorProfileId, int ItemId, int OwnerUserId,
    string Name, string? Description, string? Category,
    decimal? Price, string? Currency, string? ImageUrl, string? Allergens,
    bool IsVegetarian, bool IsVegan, bool IsGlutenFree, int SortOrder, bool IsAvailable)
    : IRequest<VendorMenuItem?>;
