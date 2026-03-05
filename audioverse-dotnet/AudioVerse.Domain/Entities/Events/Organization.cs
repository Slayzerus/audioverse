namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Top-level organization that groups leagues (e.g. FIFA, NBA, Netflix).
/// Optional — events and leagues can exist without an organization.
/// </summary>
public class Organization
{
    public int Id { get; set; }

    /// <summary>Organization name (e.g. "FIFA", "NBA", "Netflix").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Logo URL (e.g. badge or brand image).</summary>
    public string? LogoUrl { get; set; }

    /// <summary>Website URL.</summary>
    public string? Website { get; set; }

    /// <summary>User who created/manages this organization.</summary>
    public int? OwnerId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Leagues belonging to this organization.</summary>
    public List<League> Leagues { get; set; } = new();
}
