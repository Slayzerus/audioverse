using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IExternalAccountRepository.
/// Handles OAuth external account linking and token management.
/// </summary>
public class ExternalAccountRepositoryEF : IExternalAccountRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<ExternalAccountRepositoryEF> _logger;

    public ExternalAccountRepositoryEF(AudioVerseDbContext dbContext, ILogger<ExternalAccountRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> LinkAccountAsync(UserExternalAccount account)
    {
        // Check if already linked
        var existing = await _dbContext.UserExternalAccounts
            .FirstOrDefaultAsync(a => a.UserProfileId == account.UserProfileId && a.Platform == account.Platform);

        if (existing != null)
        {
            // Update existing link
            existing.ExternalUserId = account.ExternalUserId;
            existing.DisplayName = account.DisplayName;
            existing.Email = account.Email;
            existing.AvatarUrl = account.AvatarUrl;
            existing.AccessToken = account.AccessToken;
            existing.RefreshToken = account.RefreshToken;
            existing.TokenExpiresAt = account.TokenExpiresAt;
            existing.Scopes = account.Scopes;
            existing.LinkedAt = DateTime.UtcNow;
            existing.LastUsedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Updated external account link: User {UserId}, Platform {Platform}", 
                account.UserProfileId, account.Platform);
            return existing.Id;
        }

        // Create new link
        _dbContext.UserExternalAccounts.Add(account);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Linked external account: User {UserId}, Platform {Platform}", 
            account.UserProfileId, account.Platform);
        return account.Id;
    }

    /// <inheritdoc />
    public async Task<UserExternalAccount?> GetByPlatformAsync(int userId, ExternalPlatform platform)
    {
        return await _dbContext.UserExternalAccounts
            .FirstOrDefaultAsync(a => a.UserProfileId == userId && a.Platform == platform);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UserExternalAccount>> GetUserAccountsAsync(int userId)
    {
        return await _dbContext.UserExternalAccounts
            .Where(a => a.UserProfileId == userId)
            .OrderBy(a => a.Platform)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateTokensAsync(int id, string accessToken, string? refreshToken, DateTime? expiresAt)
    {
        var account = await _dbContext.UserExternalAccounts.FindAsync(id);
        if (account == null) return false;

        account.AccessToken = accessToken;
        if (refreshToken != null)
            account.RefreshToken = refreshToken;
        account.TokenExpiresAt = expiresAt;
        account.LastUsedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        _logger.LogDebug("Updated tokens for external account {Id}", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> UnlinkAccountAsync(int userId, ExternalPlatform platform)
    {
        var account = await _dbContext.UserExternalAccounts
            .FirstOrDefaultAsync(a => a.UserProfileId == userId && a.Platform == platform);

        if (account == null) return false;

        _dbContext.UserExternalAccounts.Remove(account);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Unlinked external account: User {UserId}, Platform {Platform}", userId, platform);
        return true;
    }

    /// <inheritdoc />
    public async Task<UserExternalAccount?> FindByExternalIdAsync(ExternalPlatform platform, string externalUserId)
    {
        return await _dbContext.UserExternalAccounts
            .Include(a => a.UserProfile)
            .FirstOrDefaultAsync(a => a.Platform == platform && a.ExternalUserId == externalUserId);
    }

    /// <inheritdoc />
    public async Task<bool> UpdateLastUsedAsync(int id)
    {
        var account = await _dbContext.UserExternalAccounts.FindAsync(id);
        if (account == null) return false;

        account.LastUsedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> IsLinkedAsync(int userId, ExternalPlatform platform)
    {
        return await _dbContext.UserExternalAccounts
            .AnyAsync(a => a.UserProfileId == userId && a.Platform == platform);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UserExternalAccount>> GetExpiredAccountsAsync(int bufferMinutes = 5)
    {
        var threshold = DateTime.UtcNow.AddMinutes(bufferMinutes);
        return await _dbContext.UserExternalAccounts
            .Where(a => a.TokenExpiresAt != null && a.TokenExpiresAt <= threshold && a.RefreshToken != null)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UserExternalAccount>> GetActiveAccountsAsync(int userId)
    {
        return await _dbContext.UserExternalAccounts
            .Where(x => x.UserProfileId == userId && x.IsActive)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<UserExternalAccount> SaveOrUpdateConnectionAsync(int userId, ExternalPlatform platform, UserExternalAccount data)
    {
        var existing = await _dbContext.UserExternalAccounts
            .FirstOrDefaultAsync(x => x.UserProfileId == userId && x.Platform == platform);

        if (existing != null)
        {
            existing.ExternalUserId = data.ExternalUserId;
            existing.DisplayName = data.DisplayName;
            existing.Email = data.Email;
            existing.AvatarUrl = data.AvatarUrl;
            existing.AccessToken = data.AccessToken;
            existing.RefreshToken = data.RefreshToken ?? existing.RefreshToken;
            existing.TokenExpiresAt = data.TokenExpiresAt;
            existing.Scopes = data.Scopes ?? existing.Scopes;
            existing.LastUsedAt = DateTime.UtcNow;
            existing.IsActive = true;
        }
        else
        {
            existing = new UserExternalAccount
            {
                UserProfileId = userId,
                Platform = platform,
                ExternalUserId = data.ExternalUserId,
                DisplayName = data.DisplayName,
                Email = data.Email,
                AvatarUrl = data.AvatarUrl,
                AccessToken = data.AccessToken,
                RefreshToken = data.RefreshToken,
                TokenExpiresAt = data.TokenExpiresAt,
                Scopes = data.Scopes,
                LinkedAt = DateTime.UtcNow,
                IsActive = true
            };
            _dbContext.UserExternalAccounts.Add(existing);
        }

        await _dbContext.SaveChangesAsync();
        return existing;
    }

    /// <inheritdoc />
    public async Task RemoveAsync(UserExternalAccount account)
    {
        _dbContext.UserExternalAccounts.Remove(account);
        await _dbContext.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task SaveChangesAsync() => await _dbContext.SaveChangesAsync();
}
