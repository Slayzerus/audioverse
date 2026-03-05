using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Dodaj pozycję do cennika vendora.</summary>
/// <summary>
/// Add a price list item to a vendor.
/// </summary>
public record AddPriceListItemCommand(
    int VendorProfileId, int OwnerUserId,
    string Name, string? Description, VendorServiceCategory Category,
    decimal Price, decimal? PriceFrom, decimal? PriceTo, string? Currency, string? PriceUnit,
    int? MinQuantity, string? ImageUrl, int SortOrder)
    : IRequest<VendorPriceListItem?>;
