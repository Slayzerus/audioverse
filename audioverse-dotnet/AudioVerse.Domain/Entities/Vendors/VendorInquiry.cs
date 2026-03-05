namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Zapytanie ofertowe od klienta do vendora (formularz kontaktowy + szczegóły eventu).
/// </summary>
public class VendorInquiry
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }

    /// <summary>ID zalogowanego użytkownika (jeśli jest).</summary>
    public int? UserId { get; set; }

    /// <summary>Imię i nazwisko pytającego.</summary>
    public string ContactName { get; set; } = string.Empty;

    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }

    /// <summary>ID powiązanego eventu (opcjonalny).</summary>
    public int? EventId { get; set; }

    /// <summary>Data planowanego eventu.</summary>
    public DateTime? EventDate { get; set; }

    /// <summary>Liczba gości.</summary>
    public int? GuestCount { get; set; }

    /// <summary>Treść zapytania.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Budżet orientacyjny.</summary>
    public decimal? Budget { get; set; }

    public string? Currency { get; set; }

    public VendorInquiryStatus Status { get; set; } = VendorInquiryStatus.New;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAtUtc { get; set; }
}
