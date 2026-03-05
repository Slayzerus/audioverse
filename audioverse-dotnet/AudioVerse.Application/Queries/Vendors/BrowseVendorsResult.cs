namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Paginated vendor browse result.</summary>
public record BrowseVendorsResult(IEnumerable<VendorListDto> Items, int Total, int Page, int PageSize);
