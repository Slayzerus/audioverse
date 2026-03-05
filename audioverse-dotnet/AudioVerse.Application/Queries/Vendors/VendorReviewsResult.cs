namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Paginated vendor reviews result DTO.
/// </summary>
public record VendorReviewsResult(IEnumerable<VendorReviewDto> Items, int Total);
