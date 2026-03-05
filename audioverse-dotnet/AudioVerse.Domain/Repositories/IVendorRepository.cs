using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repozytorium dla modułu Vendor Marketplace — profile, cenniki, menu, portfolio, recenzje, zapytania, oferty.
/// </summary>
public interface IVendorRepository
{
    // ── Profil ──

    /// <summary>Pobiera profil vendora po ID.</summary>
    Task<VendorProfile?> GetProfileByIdAsync(int id);

    /// <summary>Pobiera profil vendora po slug.</summary>
    Task<VendorProfile?> GetProfileBySlugAsync(string slug);

    /// <summary>Sprawdza czy profil istnieje dla organizacji.</summary>
    Task<bool> ProfileExistsForOrganizationAsync(int organizationId);

    /// <summary>Tworzy nowy profil vendora.</summary>
    Task<VendorProfile> CreateProfileAsync(VendorProfile profile);

    /// <summary>Zapisuje zmiany profilu vendora.</summary>
    Task SaveChangesAsync(CancellationToken ct = default);

    // ── Weryfikacja właściciela ──

    /// <summary>Sprawdza czy userId jest ownerem organizacji vendora.</summary>
    Task<bool> IsVendorOwnerAsync(int vendorProfileId, int userId, CancellationToken ct = default);

    // ── Cennik (PriceList) ──

    /// <summary>Dodaje pozycję cennika.</summary>
    Task<VendorPriceListItem> AddPriceListItemAsync(VendorPriceListItem item);

    /// <summary>Pobiera pozycję cennika po ID.</summary>
    Task<VendorPriceListItem?> GetPriceListItemByIdAsync(int id);

    /// <summary>Pobiera cennik vendora (dostępne pozycje).</summary>
    Task<IEnumerable<VendorPriceListItem>> GetPriceListAsync(int vendorProfileId);

    /// <summary>Usuwa pozycję cennika.</summary>
    Task RemovePriceListItemAsync(VendorPriceListItem item);

    // ── Menu ──

    /// <summary>Dodaje pozycję menu.</summary>
    Task<VendorMenuItem> AddMenuItemAsync(VendorMenuItem item);

    /// <summary>Pobiera pozycję menu po ID.</summary>
    Task<VendorMenuItem?> GetMenuItemByIdAsync(int id);

    /// <summary>Pobiera menu vendora (dostępne pozycje).</summary>
    Task<IEnumerable<VendorMenuItem>> GetMenuAsync(int vendorProfileId);

    /// <summary>Usuwa pozycję menu.</summary>
    Task RemoveMenuItemAsync(VendorMenuItem item);

    // ── Portfolio ──

    /// <summary>Dodaje element portfolio.</summary>
    Task<VendorPortfolioItem> AddPortfolioItemAsync(VendorPortfolioItem item);

    /// <summary>Pobiera element portfolio po ID.</summary>
    Task<VendorPortfolioItem?> GetPortfolioItemByIdAsync(int id);

    /// <summary>Pobiera portfolio vendora.</summary>
    Task<IEnumerable<VendorPortfolioItem>> GetPortfolioAsync(int vendorProfileId);

    /// <summary>Usuwa element portfolio.</summary>
    Task RemovePortfolioItemAsync(VendorPortfolioItem item);

    // ── Recenzje ──

    /// <summary>Dodaje recenzję.</summary>
    Task<VendorReview> AddReviewAsync(VendorReview review);

    /// <summary>Pobiera recenzje vendora (paginowane).</summary>
    Task<(IEnumerable<VendorReview> Items, int Total)> GetReviewsAsync(int vendorProfileId, int page, int pageSize);

    /// <summary>Sprawdza czy użytkownik już wystawił recenzję.</summary>
    Task<bool> HasUserReviewedAsync(int vendorProfileId, int userId);

    /// <summary>Przelicza średnią ocenę i liczbę recenzji profilu.</summary>
    Task RecalculateRatingAsync(int vendorProfileId, CancellationToken ct = default);

    // ── Zapytania ofertowe ──

    /// <summary>Tworzy zapytanie ofertowe.</summary>
    Task<VendorInquiry> CreateInquiryAsync(VendorInquiry inquiry);

    /// <summary>Pobiera zapytanie po ID.</summary>
    Task<VendorInquiry?> GetInquiryByIdAsync(int id);

    /// <summary>Pobiera zapytania vendora.</summary>
    Task<IEnumerable<VendorInquiry>> GetInquiriesAsync(int vendorProfileId);

    // ── Oferty ──

    /// <summary>Tworzy ofertę.</summary>
    Task<VendorOffer> CreateOfferAsync(VendorOffer offer);

    /// <summary>Pobiera ofertę po ID (z pozycjami).</summary>
    Task<VendorOffer?> GetOfferByIdAsync(int id);

    /// <summary>Pobiera oferty vendora.</summary>
    Task<IEnumerable<VendorOffer>> GetOffersByVendorAsync(int vendorProfileId);

    /// <summary>Pobiera oferty klienta.</summary>
    Task<IEnumerable<VendorOffer>> GetOffersByClientAsync(int userId);

    // ── Event Vendors ──

    /// <summary>Dodaje vendora do eventu.</summary>
    Task<EventVendor> AddEventVendorAsync(EventVendor ev);

    /// <summary>Pobiera powiązanie eventu z vendorem po ID.</summary>
    Task<EventVendor?> GetEventVendorByIdAsync(int id);

    /// <summary>Pobiera vendorów eventu.</summary>
    Task<IEnumerable<EventVendor>> GetEventVendorsAsync(int eventId);

    // ── Browse / Search ──

    /// <summary>Przeglądaj vendorów (filtrowanie, paginacja).</summary>
    Task<(IEnumerable<VendorProfile> Items, int Total)> BrowseAsync(
        VendorServiceCategory? category, string? city, string? region, string? country,
        string? search, int page, int pageSize, CancellationToken ct = default);

    // ── Organization helpers ──

    /// <summary>Pobiera organizację po ID (potrzebne do weryfikacji ownera).</summary>
    Task<(int Id, string Name, string? LogoUrl, int? OwnerId)?> GetOrganizationByIdAsync(int organizationId, CancellationToken ct = default);

    /// <summary>Pobiera nazwy organizacji po ID-ach.</summary>
    Task<Dictionary<int, string>> GetOrganizationNamesByIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);

    // ── Category stats ──

    /// <summary>Pobiera statystyki kategorii (nazwa + count aktywnych vendorów).</summary>
    Task<IEnumerable<(string Category, int Count)>> GetCategoryStatsAsync(CancellationToken ct = default);

    // ── Vendor offers (query) ──

    /// <summary>Pobiera zapytania ofertowe vendora z opcjonalnym filtrem statusu.</summary>
    Task<IEnumerable<VendorInquiry>> GetInquiriesByVendorAsync(int vendorProfileId, VendorInquiryStatus? status = null, CancellationToken ct = default);

    /// <summary>Pobiera ofertę po ID z pozycjami.</summary>
    Task<VendorOffer?> GetOfferWithItemsAsync(int offerId, CancellationToken ct = default);

    /// <summary>Pobiera oferty klienta (userId).</summary>
    Task<IEnumerable<VendorOffer>> GetOffersByClientUserIdAsync(int userId, CancellationToken ct = default);

    // ── Event vendors (query) ──

    /// <summary>Pobiera vendorów eventu z profilami.</summary>
    Task<IEnumerable<(EventVendor Ev, VendorProfile? Profile)>> GetEventVendorsWithProfilesAsync(int eventId, CancellationToken ct = default);
}
