using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get vendor reviews (public, paginated).</summary>
public record GetVendorReviewsQuery(int VendorProfileId, int Page = 1, int PageSize = 20) : IRequest<VendorReviewsResult>;
