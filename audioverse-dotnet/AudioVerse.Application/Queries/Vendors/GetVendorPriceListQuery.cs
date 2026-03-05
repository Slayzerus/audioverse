using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get a vendor's price list (public).</summary>
public record GetVendorPriceListQuery(int VendorProfileId) : IRequest<IEnumerable<VendorPriceListItem>>;
