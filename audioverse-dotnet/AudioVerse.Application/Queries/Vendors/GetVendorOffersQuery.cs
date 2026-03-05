using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>List vendor's offers (owner only).</summary>
public record GetVendorOffersQuery(int VendorProfileId, int OwnerUserId) : IRequest<IEnumerable<VendorOfferListDto>>;
