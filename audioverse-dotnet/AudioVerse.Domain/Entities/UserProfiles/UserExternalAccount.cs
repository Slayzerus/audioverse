namespace AudioVerse.Domain.Entities.UserProfiles;

/// <summary>
/// Represents a user's linked external account (Spotify, Tidal, Google, Steam, etc.)
/// </summary>
public class UserExternalAccount
{
    public int Id { get; set; }
    public int UserProfileId { get; set; }
    public UserProfile? UserProfile { get; set; }

    /// <summary>
    /// Platform identifier: Spotify, Tidal, YouTube, Google, Steam, BGG
    /// </summary>
    public ExternalPlatform Platform { get; set; }

    /// <summary>
    /// External user ID on the platform
    /// </summary>
    public string ExternalUserId { get; set; } = string.Empty;

    /// <summary>
    /// Display name / username on the platform
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Email associated with the external account
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Profile picture URL from the platform
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// OAuth access token (encrypted)
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// OAuth refresh token (encrypted)
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// When the access token expires
    /// </summary>
    public DateTime? TokenExpiresAt { get; set; }

    /// <summary>
    /// OAuth scopes granted
    /// </summary>
    public string? Scopes { get; set; }

    /// <summary>
    /// When the account was linked
    /// </summary>
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last successful sync/use of this connection
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// Is this connection currently active and valid
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Platform-specific metadata (JSON)
    /// </summary>
    public string? Metadata { get; set; }
}

/// <summary>
/// Supported external platforms for account linking
/// </summary>
