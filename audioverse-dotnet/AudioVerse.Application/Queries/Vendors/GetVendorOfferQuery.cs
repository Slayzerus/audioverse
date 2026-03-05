using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get a vendor offer by ID (owner or client).</summary>
public record GetVendorOfferQuery(int OfferId, int UserId) : IRequest<VendorOffer?>;
