using AudioVerse.Domain.Enums.Games;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// Additional file / asset attached to a game (images, audio, data files, etc.).
/// </summary>
public class AvGameAsset
{
    public int Id { get; set; }

    public int GameId { get; set; }
    public AvGame? Game { get; set; }

    /// <summary>Asset type (image, audio, data, etc.).</summary>
    public AvGameAssetType AssetType { get; set; }

    /// <summary>Display name or label.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Storage URL or MinIO key.</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>MIME type (e.g. "image/png", "application/json").</summary>
    public string? MimeType { get; set; }

    /// <summary>File size in bytes.</summary>
    public long? FileSizeBytes { get; set; }

    /// <summary>Sort order for ordered asset lists.</summary>
    public int SortOrder { get; set; }

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
