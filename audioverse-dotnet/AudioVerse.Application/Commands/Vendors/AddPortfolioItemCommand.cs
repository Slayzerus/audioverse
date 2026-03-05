using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Commands.Vendors;

/// <summary>Dodaj element do portfolio vendora.</summary>
/// <summary>
/// Add a portfolio item to a vendor.
/// </summary>
public record AddPortfolioItemCommand(
    int VendorProfileId, int OwnerUserId,
    string? Title, string? Description, string ImageUrl, string? MediaType, int SortOrder)
    : IRequest<VendorPortfolioItem?>;
