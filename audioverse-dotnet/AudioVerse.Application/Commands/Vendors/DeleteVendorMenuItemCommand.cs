using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Usuń pozycję menu vendora.</summary>
/// <summary>
/// Delete a vendor menu item.
/// </summary>
public record DeleteVendorMenuItemCommand(int VendorProfileId, int ItemId, int OwnerUserId) : IRequest<bool>;
