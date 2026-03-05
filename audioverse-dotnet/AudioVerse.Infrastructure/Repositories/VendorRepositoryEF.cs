using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IVendorRepository.
/// Obsługuje profile vendorów, cenniki, menu, portfolio, recenzje, zapytania, oferty i powiązania z eventami.
/// </summary>
public class VendorRepositoryEF(AudioVerseDbContext db) : IVendorRepository
{
    // ── Profil ──

    public async Task<VendorProfile?> GetProfileByIdAsync(int id) =>
        await db.VendorProfiles.FindAsync(id);

    public async Task<VendorProfile?> GetProfileBySlugAsync(string slug) =>
        await db.VendorProfiles.FirstOrDefaultAsync(v => v.Slug == slug && v.IsActive);

    public async Task<bool> ProfileExistsForOrganizationAsync(int organizationId) =>
        await db.VendorProfiles.AnyAsync(v => v.OrganizationId == organizationId);

    public async Task<VendorProfile> CreateProfileAsync(VendorProfile profile)
    {
        db.VendorProfiles.Add(profile);
        await db.SaveChangesAsync();
        return profile;
    }

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    // ── Weryfikacja właściciela ──

    public async Task<bool> IsVendorOwnerAsync(int vendorProfileId, int userId, CancellationToken ct)
    {
        var v = await db.VendorProfiles.FindAsync(new object[] { vendorProfileId }, ct);
        if (v == null) return false;
        var org = await db.Organizations.FindAsync(new object[] { v.OrganizationId }, ct);
        return org?.OwnerId == userId;
    }

    // ── Cennik ──

    public async Task<VendorPriceListItem> AddPriceListItemAsync(VendorPriceListItem item)
    {
        db.VendorPriceListItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<VendorPriceListItem?> GetPriceListItemByIdAsync(int id) =>
        await db.VendorPriceListItems.FindAsync(id);

    public async Task<IEnumerable<VendorPriceListItem>> GetPriceListAsync(int vendorProfileId) =>
        await db.VendorPriceListItems
            .Where(p => p.VendorProfileId == vendorProfileId && p.IsAvailable)
            .OrderBy(p => p.Category).ThenBy(p => p.SortOrder)
            .ToListAsync();

    public async Task RemovePriceListItemAsync(VendorPriceListItem item)
    {
        db.VendorPriceListItems.Remove(item);
        await db.SaveChangesAsync();
    }

    // ── Menu ──

    public async Task<VendorMenuItem> AddMenuItemAsync(VendorMenuItem item)
    {
        db.VendorMenuItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<VendorMenuItem?> GetMenuItemByIdAsync(int id) =>
        await db.VendorMenuItems.FindAsync(id);

    public async Task<IEnumerable<VendorMenuItem>> GetMenuAsync(int vendorProfileId) =>
        await db.VendorMenuItems
            .Where(m => m.VendorProfileId == vendorProfileId && m.IsAvailable)
            .OrderBy(m => m.Category).ThenBy(m => m.SortOrder)
            .ToListAsync();

    public async Task RemoveMenuItemAsync(VendorMenuItem item)
    {
        db.VendorMenuItems.Remove(item);
        await db.SaveChangesAsync();
    }

    // ── Portfolio ──

    public async Task<VendorPortfolioItem> AddPortfolioItemAsync(VendorPortfolioItem item)
    {
        db.VendorPortfolioItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    public async Task<VendorPortfolioItem?> GetPortfolioItemByIdAsync(int id) =>
        await db.VendorPortfolioItems.FindAsync(id);

    public async Task<IEnumerable<VendorPortfolioItem>> GetPortfolioAsync(int vendorProfileId) =>
        await db.VendorPortfolioItems
            .Where(p => p.VendorProfileId == vendorProfileId)
            .OrderBy(p => p.SortOrder)
            .ToListAsync();

    public async Task RemovePortfolioItemAsync(VendorPortfolioItem item)
    {
        db.VendorPortfolioItems.Remove(item);
        await db.SaveChangesAsync();
    }

    // ── Recenzje ──

    public async Task<VendorReview> AddReviewAsync(VendorReview review)
    {
        db.VendorReviews.Add(review);
        await db.SaveChangesAsync();
        return review;
    }

    public async Task<(IEnumerable<VendorReview> Items, int Total)> GetReviewsAsync(int vendorProfileId, int page, int pageSize)
    {
        var q = db.VendorReviews.Where(r => r.VendorProfileId == vendorProfileId && !r.IsDeleted);
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return (items, total);
    }

    public async Task<bool> HasUserReviewedAsync(int vendorProfileId, int userId) =>
        await db.VendorReviews.AnyAsync(r => r.VendorProfileId == vendorProfileId && r.UserId == userId && !r.IsDeleted);

    public async Task RecalculateRatingAsync(int vendorProfileId, CancellationToken ct)
    {
        var profile = await db.VendorProfiles.FindAsync(new object[] { vendorProfileId }, ct);
        if (profile == null) return;
        var reviews = db.VendorReviews.Where(r => r.VendorProfileId == vendorProfileId && !r.IsDeleted);
        profile.ReviewCount = await reviews.CountAsync(ct);
        profile.AverageRating = profile.ReviewCount > 0 ? await reviews.AverageAsync(r => r.Rating, ct) : 0;
        await db.SaveChangesAsync(ct);
    }

    // ── Zapytania ofertowe ──

    public async Task<VendorInquiry> CreateInquiryAsync(VendorInquiry inquiry)
    {
        db.VendorInquiries.Add(inquiry);
        await db.SaveChangesAsync();
        return inquiry;
    }

    public async Task<VendorInquiry?> GetInquiryByIdAsync(int id) =>
        await db.VendorInquiries.FindAsync(id);

    public async Task<IEnumerable<VendorInquiry>> GetInquiriesAsync(int vendorProfileId) =>
        await db.VendorInquiries
            .Where(i => i.VendorProfileId == vendorProfileId)
            .OrderByDescending(i => i.CreatedAtUtc)
            .ToListAsync();

    // ── Oferty ──

    public async Task<VendorOffer> CreateOfferAsync(VendorOffer offer)
    {
        db.VendorOffers.Add(offer);
        await db.SaveChangesAsync();
        return offer;
    }

    public async Task<VendorOffer?> GetOfferByIdAsync(int id) =>
        await db.VendorOffers.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);

    public async Task<IEnumerable<VendorOffer>> GetOffersByVendorAsync(int vendorProfileId) =>
        await db.VendorOffers
            .Where(o => o.VendorProfileId == vendorProfileId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();

    public async Task<IEnumerable<VendorOffer>> GetOffersByClientAsync(int userId) =>
        await db.VendorOffers
            .Where(o => o.ClientUserId == userId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync();

    // ── Event Vendors ──

    public async Task<EventVendor> AddEventVendorAsync(EventVendor ev)
    {
        db.EventVendors.Add(ev);
        await db.SaveChangesAsync();
        return ev;
    }

    public async Task<EventVendor?> GetEventVendorByIdAsync(int id) =>
        await db.EventVendors.FindAsync(id);

    public async Task<IEnumerable<EventVendor>> GetEventVendorsAsync(int eventId) =>
        await db.EventVendors
            .Where(ev => ev.EventId == eventId)
            .ToListAsync();

    // ── Browse ──

    public async Task<(IEnumerable<VendorProfile> Items, int Total)> BrowseAsync(
        VendorServiceCategory? category, string? city, string? region, string? country,
        string? search, int page, int pageSize, CancellationToken ct)
    {
        var q = db.VendorProfiles.Where(v => v.IsActive).AsQueryable();
        if (category.HasValue) q = q.Where(v => v.PrimaryCategory == category.Value);
        if (!string.IsNullOrEmpty(city)) q = q.Where(v => v.City != null && v.City.ToLower().Contains(city.ToLower()));
        if (!string.IsNullOrEmpty(region)) q = q.Where(v => v.Region != null && v.Region.ToLower().Contains(region.ToLower()));
        if (!string.IsNullOrEmpty(country)) q = q.Where(v => v.CountryCode == country.ToUpper());
        if (!string.IsNullOrEmpty(search))
        {
            var s = search.ToLower();
            q = q.Where(v => v.Slug.Contains(s) || (v.ShortDescription != null && v.ShortDescription.ToLower().Contains(s)));
        }

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(v => v.IsVerified).ThenByDescending(v => v.AverageRating)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    // ── Organization helpers ──

    public async Task<(int Id, string Name, string? LogoUrl, int? OwnerId)?> GetOrganizationByIdAsync(int organizationId, CancellationToken ct = default)
    {
        var org = await db.Organizations.FindAsync(new object[] { organizationId }, ct);
        if (org == null) return null;
        return (org.Id, org.Name, org.LogoUrl, org.OwnerId);
    }

    public async Task<Dictionary<int, string>> GetOrganizationNamesByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
        => await db.Organizations.Where(o => ids.Contains(o.Id)).ToDictionaryAsync(o => o.Id, o => o.Name, ct);

    // ── Category stats ──

    public async Task<IEnumerable<(string Category, int Count)>> GetCategoryStatsAsync(CancellationToken ct = default)
    {
        var result = await db.VendorProfiles.Where(v => v.IsActive)
            .GroupBy(v => v.PrimaryCategory)
            .Select(g => new { Category = g.Key.ToString(), Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .ToListAsync(ct);
        return result.Select(c => (c.Category, c.Count));
    }

    // ── Vendor offers (query) ──

    public async Task<IEnumerable<VendorInquiry>> GetInquiriesByVendorAsync(int vendorProfileId, VendorInquiryStatus? status = null, CancellationToken ct = default)
    {
        var q = db.VendorInquiries.Where(i => i.VendorProfileId == vendorProfileId);
        if (status.HasValue) q = q.Where(i => i.Status == status.Value);
        return await q.OrderByDescending(i => i.CreatedAtUtc).ToListAsync(ct);
    }

    public async Task<VendorOffer?> GetOfferWithItemsAsync(int offerId, CancellationToken ct = default)
        => await db.VendorOffers.Include(o => o.Items.OrderBy(i => i.SortOrder)).FirstOrDefaultAsync(o => o.Id == offerId, ct);

    public async Task<IEnumerable<VendorOffer>> GetOffersByClientUserIdAsync(int userId, CancellationToken ct = default)
        => await db.VendorOffers.Where(o => o.ClientUserId == userId).OrderByDescending(o => o.CreatedAtUtc).ToListAsync(ct);

    // ── Event vendors (query) ──

    public async Task<IEnumerable<(EventVendor Ev, VendorProfile? Profile)>> GetEventVendorsWithProfilesAsync(int eventId, CancellationToken ct = default)
    {
        var vendors = await db.EventVendors.Where(ev => ev.EventId == eventId).ToListAsync(ct);
        var vpIds = vendors.Select(v => v.VendorProfileId).Distinct().ToList();
        var profiles = await db.VendorProfiles.Where(v => vpIds.Contains(v.Id)).ToDictionaryAsync(v => v.Id, v => v, ct);
        return vendors.Select(ev => (ev, profiles.GetValueOrDefault(ev.VendorProfileId)));
    }
}
