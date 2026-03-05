using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get offers received by a client (by userId).</summary>
public record GetMyOffersQuery(int UserId) : IRequest<IEnumerable<VendorOfferListDto>>;
