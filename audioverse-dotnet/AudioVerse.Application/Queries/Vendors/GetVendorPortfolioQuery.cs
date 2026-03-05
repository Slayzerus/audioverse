using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get a vendor's portfolio / gallery (public).</summary>
public record GetVendorPortfolioQuery(int VendorProfileId) : IRequest<IEnumerable<VendorPortfolioItem>>;
