namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Komentarz do stacji radiowej (książka gości / opinie).
/// </summary>
public class RadioComment
{
    public int Id { get; set; }
    public int RadioStationId { get; set; }
    public int? UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    /// <summary>Opcjonalna ocena stacji (1–5).</summary>
    public int? Rating { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
}
