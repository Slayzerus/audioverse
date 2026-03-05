using AudioVerse.Application.Queries.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

/// <summary>Handlery zapytań read-only: kategorie, profil, cennik, menu, portfolio, recenzje.</summary>
public class VendorQueryHandlers(IVendorRepository repo)
    : IRequestHandler<GetVendorCategoriesQuery, IEnumerable<VendorCategoryDto>>,
      IRequestHandler<GetVendorProfileQuery, VendorProfileDto?>,
      IRequestHandler<GetVendorPriceListQuery, IEnumerable<VendorPriceListItem>>,
      IRequestHandler<GetVendorMenuQuery, IEnumerable<VendorMenuItem>>,
      IRequestHandler<GetVendorPortfolioQuery, IEnumerable<VendorPortfolioItem>>,
      IRequestHandler<GetVendorReviewsQuery, VendorReviewsResult>
{
    public async Task<IEnumerable<VendorCategoryDto>> Handle(GetVendorCategoriesQuery req, CancellationToken ct)
    {
        var stats = await repo.GetCategoryStatsAsync(ct);
        return stats.Select(s => new VendorCategoryDto(s.Category, s.Count));
    }

    public async Task<VendorProfileDto?> Handle(GetVendorProfileQuery req, CancellationToken ct)
    {
        var v = await repo.GetProfileBySlugAsync(req.Slug);
        if (v == null) return null;
        var org = await repo.GetOrganizationByIdAsync(v.OrganizationId, ct);
        return new VendorProfileDto(
            v.Id, v.OrganizationId, org?.Name ?? "", org?.LogoUrl,
            v.Slug, v.ShortDescription, v.FullDescription,
            v.PrimaryCategory.ToString(), v.AdditionalCategories,
            v.Phone, v.Email, v.Website, v.CoverImageUrl,
            v.City, v.Region, v.CountryCode, v.Latitude, v.Longitude, v.ServiceRadiusKm,
            v.AverageRating, v.ReviewCount, v.IsVerified);
    }

    public async Task<IEnumerable<VendorPriceListItem>> Handle(GetVendorPriceListQuery req, CancellationToken ct) =>
        await repo.GetPriceListAsync(req.VendorProfileId);

    public async Task<IEnumerable<VendorMenuItem>> Handle(GetVendorMenuQuery req, CancellationToken ct) =>
        await repo.GetMenuAsync(req.VendorProfileId);

    public async Task<IEnumerable<VendorPortfolioItem>> Handle(GetVendorPortfolioQuery req, CancellationToken ct) =>
        await repo.GetPortfolioAsync(req.VendorProfileId);

    public async Task<VendorReviewsResult> Handle(GetVendorReviewsQuery req, CancellationToken ct)
    {
        var pageSize = Math.Clamp(req.PageSize, 1, 50);
        var (items, total) = await repo.GetReviewsAsync(req.VendorProfileId, req.Page, pageSize);
        var dtos = items.Select(r => new VendorReviewDto(r.Id, r.UserId, r.Rating, r.Comment, r.EventId, r.CreatedAtUtc));
        return new VendorReviewsResult(dtos, total);
    }
}
