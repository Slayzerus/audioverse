using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Usuń pozycję z cennika vendora.</summary>
/// <summary>
/// Delete a vendor price list item.
/// </summary>
public record DeletePriceListItemCommand(int VendorProfileId, int ItemId, int OwnerUserId) : IRequest<bool>;
