namespace AudioVerse.Domain.Entities.Audio;

/// <summary>
/// Soundfont bank — a collection of instrument samples (typically .sf2 / .sf3 / .sfz).
/// Files are stored in MinIO object storage.
/// </summary>
public class Soundfont
{
    public int Id { get; set; }

    /// <summary>Soundfont display name (e.g. "FluidR3 GM", "Yamaha DX7 Collection").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description or notes.</summary>
    public string? Description { get; set; }

    /// <summary>Soundfont format: SF2, SF3, SFZ, DLS, GIG, Single.</summary>
    public SoundfontFormat Format { get; set; } = SoundfontFormat.SF2;

    /// <summary>Author / creator of the soundfont.</summary>
    public string? Author { get; set; }

    /// <summary>Version string (e.g. "2.1", "GM Level 1").</summary>
    public string? Version { get; set; }

    /// <summary>License info (e.g. "CC0", "Proprietary", "GPL").</summary>
    public string? License { get; set; }

    /// <summary>Number of presets/instruments contained.</summary>
    public int? PresetCount { get; set; }

    /// <summary>Total size of all files in bytes.</summary>
    public long TotalSizeBytes { get; set; }

    /// <summary>Tags for categorization (comma-separated, e.g. "piano,strings,orchestra").</summary>
    public string? Tags { get; set; }

    /// <summary>User who uploaded this soundfont.</summary>
    public int? UploadedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Files belonging to this soundfont (the .sf2 itself, readme, license files, etc.).</summary>
    public List<SoundfontFile> Files { get; set; } = new();
}
