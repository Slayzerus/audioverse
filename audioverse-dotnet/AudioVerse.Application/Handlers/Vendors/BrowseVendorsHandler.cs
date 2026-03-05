using AudioVerse.Application.Queries.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

/// <summary>Przeglądanie vendorów w marketplace z filtrowaniem i paginacją.</summary>
public class BrowseVendorsHandler(IVendorRepository repo) : IRequestHandler<BrowseVendorsQuery, BrowseVendorsResult>
{
    public async Task<BrowseVendorsResult> Handle(BrowseVendorsQuery req, CancellationToken ct)
    {
        var pageSize = Math.Clamp(req.PageSize, 1, 100);
        var (items, total) = await repo.BrowseAsync(req.Category, req.City, req.Region, req.Country, req.Search, req.Page, pageSize, ct);

        var orgIds = items.Select(i => i.OrganizationId).Distinct().ToList();
        var orgNames = await repo.GetOrganizationNamesByIdsAsync(orgIds, ct);

        var dtos = items.Select(i => new VendorListDto(
            i.Id, i.Slug, orgNames.GetValueOrDefault(i.OrganizationId, ""),
            i.ShortDescription, i.PrimaryCategory.ToString(),
            i.City, i.Region, i.CountryCode, i.CoverImageUrl,
            i.AverageRating, i.ReviewCount, i.IsVerified));

        return new BrowseVendorsResult(dtos, total, req.Page, pageSize);
    }
}
