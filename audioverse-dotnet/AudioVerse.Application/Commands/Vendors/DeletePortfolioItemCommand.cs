using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Usuń element portfolio vendora.</summary>
/// <summary>
/// Delete a vendor portfolio item.
/// </summary>
public record DeletePortfolioItemCommand(int VendorProfileId, int ItemId, int OwnerUserId) : IRequest<bool>;
