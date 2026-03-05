using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Aktualizuj pozycję cennika vendora.</summary>
/// <summary>
/// Update a vendor price list item.
/// </summary>
public record UpdatePriceListItemCommand(
    int VendorProfileId, int ItemId, int OwnerUserId,
    string Name, string? Description, VendorServiceCategory Category,
    decimal Price, decimal? PriceFrom, decimal? PriceTo, string? Currency, string? PriceUnit,
    int? MinQuantity, string? ImageUrl, int SortOrder, bool IsAvailable)
    : IRequest<VendorPriceListItem?>;
