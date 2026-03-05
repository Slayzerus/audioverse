namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Recenzja vendora wystawiona przez użytkownika.
/// </summary>
public class VendorReview
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }
    public int UserId { get; set; }

    /// <summary>Ocena 1–5.</summary>
    public int Rating { get; set; }

    public string? Comment { get; set; }

    /// <summary>ID eventu na którym skorzystano z usług (opcjonalny).</summary>
    public int? EventId { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
