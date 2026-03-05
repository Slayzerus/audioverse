namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Profil vendora/firmy — rozszerzenie Organization o dane marketplace (cenniki, lokalizacja, kategorie usług).
/// Vendor = Organization uczestnicząca w marketplace eventów.
/// </summary>
public class VendorProfile
{
    public int Id { get; set; }

    /// <summary>FK do istniejącej Organization.</summary>
    public int OrganizationId { get; set; }

    /// <summary>Slug do URL-friendly adresu profilu.</summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>Krótki opis widoczny w liście wyników.</summary>
    public string? ShortDescription { get; set; }

    /// <summary>Pełny opis (markdown).</summary>
    public string? FullDescription { get; set; }

    /// <summary>Główna kategoria usług.</summary>
    public VendorServiceCategory PrimaryCategory { get; set; }

    /// <summary>Dodatkowe kategorie (CSV — np. "Catering,Cake,Decorations").</summary>
    public string? AdditionalCategories { get; set; }

    /// <summary>Telefon kontaktowy.</summary>
    public string? Phone { get; set; }

    /// <summary>E-mail kontaktowy.</summary>
    public string? Email { get; set; }

    /// <summary>Strona WWW.</summary>
    public string? Website { get; set; }

    /// <summary>URL zdjęcia/logo.</summary>
    public string? CoverImageUrl { get; set; }

    // ── Lokalizacja ──

    /// <summary>Miasto siedziby.</summary>
    public string? City { get; set; }

    /// <summary>Województwo/region.</summary>
    public string? Region { get; set; }

    /// <summary>Kod kraju ISO (PL, DE, US…).</summary>
    public string? CountryCode { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    /// <summary>Promień obsługi w km (null = cały kraj).</summary>
    public int? ServiceRadiusKm { get; set; }

    // ── Rating ──

    /// <summary>Średnia ocena (obliczana z recenzji).</summary>
    public double AverageRating { get; set; }

    /// <summary>Liczba recenzji.</summary>
    public int ReviewCount { get; set; }

    /// <summary>Czy profil jest zweryfikowany przez admina.</summary>
    public bool IsVerified { get; set; }

    /// <summary>Czy profil jest aktywny (widoczny w marketplace).</summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
