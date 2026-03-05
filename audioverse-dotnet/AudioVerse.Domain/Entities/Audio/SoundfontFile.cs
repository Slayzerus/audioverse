namespace AudioVerse.Domain.Entities.Audio;

/// <summary>
/// Individual file belonging to a Soundfont (the .sf2 bank, readme, license, preview audio, etc.).
/// Stored in MinIO under the "soundfonts" bucket.
/// </summary>
public class SoundfontFile
{
    public int Id { get; set; }

    /// <summary>Parent soundfont.</summary>
    public int SoundfontId { get; set; }
    public Soundfont? Soundfont { get; set; }

    /// <summary>Original filename as uploaded.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>Object key in MinIO (e.g. "soundfonts/42/FluidR3_GM.sf2").</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>MIME type (e.g. "application/octet-stream", "audio/x-soundfont").</summary>
    public string ContentType { get; set; } = "application/octet-stream";

    /// <summary>File size in bytes.</summary>
    public long SizeBytes { get; set; }

    /// <summary>File role/type within the soundfont package.</summary>
    public SoundfontFileType FileType { get; set; } = SoundfontFileType.SoundfontBank;

    /// <summary>SHA-256 hash for integrity verification.</summary>
    public string? Sha256 { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
