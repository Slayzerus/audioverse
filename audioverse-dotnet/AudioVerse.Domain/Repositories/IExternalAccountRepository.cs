using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for managing user external OAuth connections (Spotify, Google, Steam, etc.).
/// </summary>
public interface IExternalAccountRepository
{
    /// <summary>
    /// Links a new external account to a user.
    /// </summary>
    /// <param name="account">The external account to link</param>
    /// <returns>The ID of the created account link</returns>
    Task<int> LinkAccountAsync(UserExternalAccount account);

    /// <summary>
    /// Gets a user's linked account for a specific platform.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="platform">The external platform</param>
    /// <returns>The external account, or null if not linked</returns>
    Task<UserExternalAccount?> GetByPlatformAsync(int userId, ExternalPlatform platform);

    /// <summary>
    /// Gets all external accounts linked to a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>Collection of all linked external accounts</returns>
    Task<IEnumerable<UserExternalAccount>> GetUserAccountsAsync(int userId);

    /// <summary>
    /// Updates OAuth tokens for an external account.
    /// </summary>
    /// <param name="id">The external account ID</param>
    /// <param name="accessToken">The new access token</param>
    /// <param name="refreshToken">The new refresh token (optional)</param>
    /// <param name="expiresAt">When the access token expires</param>
    /// <returns>True if updated successfully</returns>
    Task<bool> UpdateTokensAsync(int id, string accessToken, string? refreshToken, DateTime? expiresAt);

    /// <summary>
    /// Unlinks an external account from a user.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="platform">The platform to unlink</param>
    /// <returns>True if unlinked successfully</returns>
    Task<bool> UnlinkAccountAsync(int userId, ExternalPlatform platform);

    /// <summary>
    /// Finds an external account by platform and external user ID.
    /// </summary>
    /// <param name="platform">The external platform</param>
    /// <param name="externalUserId">The user ID on the external platform</param>
    /// <returns>The external account, or null if not found</returns>
    Task<UserExternalAccount?> FindByExternalIdAsync(ExternalPlatform platform, string externalUserId);

    /// <summary>
    /// Updates the last used timestamp for an external account.
    /// </summary>
    /// <param name="id">The external account ID</param>
    /// <returns>True if updated successfully</returns>
    Task<bool> UpdateLastUsedAsync(int id);

    /// <summary>
    /// Checks if a user has a linked account for a specific platform.
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="platform">The external platform</param>
    /// <returns>True if account is linked</returns>
    Task<bool> IsLinkedAsync(int userId, ExternalPlatform platform);

    /// <summary>
    /// Gets expired external accounts that need token refresh.
    /// </summary>
    /// <param name="bufferMinutes">Minutes before expiry to consider as expired</param>
    /// <returns>Collection of accounts with expired/expiring tokens</returns>
    Task<IEnumerable<UserExternalAccount>> GetExpiredAccountsAsync(int bufferMinutes = 5);

    /// <summary>
    /// Gets all active external accounts for a user.
    /// </summary>
    Task<IEnumerable<UserExternalAccount>> GetActiveAccountsAsync(int userId);

    /// <summary>
    /// Saves or updates a connection (upsert by userId + platform).
    /// </summary>
    Task<UserExternalAccount> SaveOrUpdateConnectionAsync(int userId, ExternalPlatform platform, UserExternalAccount data);

    /// <summary>
    /// Removes an external account entity and saves.
    /// </summary>
    Task RemoveAsync(UserExternalAccount account);

    /// <summary>
    /// Saves pending changes.
    /// </summary>
    Task SaveChangesAsync();
}
