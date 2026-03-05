using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IUserSecurityRepository.
/// Handles user bans, login attempts, password history, and OTPs.
/// </summary>
public class UserSecurityRepositoryEF : IUserSecurityRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<UserSecurityRepositoryEF> _logger;

    public UserSecurityRepositoryEF(AudioVerseDbContext dbContext, ILogger<UserSecurityRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  USER BANS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> CreateBanAsync(UserBan ban)
    {
        _dbContext.UserBans.Add(ban);
        await _dbContext.SaveChangesAsync();
        _logger.LogWarning("User {UserId} banned. Reason: {Reason}", ban.UserId, ban.Reason);
        return ban.Id;
    }

    /// <inheritdoc />
    public async Task<UserBan?> GetActiveBanAsync(int userId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.UserBans
            .Where(b => b.UserId == userId && b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > now))
            .OrderByDescending(b => b.BannedAt)
            .FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UserBan>> GetBanHistoryAsync(int userId)
    {
        return await _dbContext.UserBans
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BannedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> DeactivateBanAsync(int banId)
    {
        var ban = await _dbContext.UserBans.FindAsync(banId);
        if (ban == null) return false;

        ban.IsActive = false;
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Ban {BanId} deactivated for user {UserId}", banId, ban.UserId);
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> IsUserBannedAsync(int userId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.UserBans
            .AnyAsync(b => b.UserId == userId && b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > now));
    }

    // ????????????????????????????????????????????????????????????
    //  LOGIN ATTEMPTS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> RecordLoginAttemptAsync(LoginAttempt attempt)
    {
        _dbContext.LoginAttempts.Add(attempt);
        await _dbContext.SaveChangesAsync();
        return attempt.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<LoginAttempt>> GetRecentAttemptsAsync(int userId, int count = 10)
    {
        return await _dbContext.LoginAttempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptTime)
            .Take(count)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<int> CountFailedAttemptsAsync(int userId, TimeSpan window)
    {
        var since = DateTime.UtcNow - window;
        return await _dbContext.LoginAttempts
            .CountAsync(a => a.UserId == userId && !a.Success && a.AttemptTime >= since);
    }

    /// <inheritdoc />
    public async Task<int> CountFailedAttemptsByIpAsync(string ipAddress, TimeSpan window)
    {
        var since = DateTime.UtcNow - window;
        return await _dbContext.LoginAttempts
            .CountAsync(a => a.IpAddress == ipAddress && !a.Success && a.AttemptTime >= since);
    }

    // ????????????????????????????????????????????????????????????
    //  PASSWORD HISTORY
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddPasswordHistoryAsync(PasswordHistory entry)
    {
        _dbContext.PasswordHistory.Add(entry);
        await _dbContext.SaveChangesAsync();
        return entry.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count = 5)
    {
        return await _dbContext.PasswordHistory
            .Where(p => p.UserProfileId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    // ????????????????????????????????????????????????????????????
    //  ONE-TIME PASSWORDS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> CreateOtpAsync(OneTimePassword otp)
    {
        _dbContext.OneTimePasswords.Add(otp);
        await _dbContext.SaveChangesAsync();
        return otp.Id;
    }

    /// <inheritdoc />
    public async Task<OneTimePassword?> GetValidOtpAsync(int userId, string code)
    {
        var now = DateTime.UtcNow;
        var query = _dbContext.OneTimePasswords
            .Where(o => o.UserId == userId && !o.IsUsed && o.ExpiresAt > now);
        if (!string.IsNullOrEmpty(code))
            query = query.Where(o => o.PasswordHash == code);
        return await query.FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<bool> MarkOtpUsedAsync(int otpId)
    {
        var otp = await _dbContext.OneTimePasswords.FindAsync(otpId);
        if (otp == null) return false;

        otp.IsUsed = true;
        otp.UsedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<int> InvalidateUserOtpsAsync(int userId)
    {
        var otps = await _dbContext.OneTimePasswords
            .Where(o => o.UserId == userId && !o.IsUsed)
            .ToListAsync();

        foreach (var otp in otps)
        {
            otp.IsUsed = true;
        }

        await _dbContext.SaveChangesAsync();
        return otps.Count;
    }

    public async Task<IEnumerable<OneTimePassword>> GetAllOtpsAsync(CancellationToken ct = default)
        => await _dbContext.OneTimePasswords.OrderByDescending(o => o.CreatedAt).ToListAsync(ct);

    // ── Login Attempts (extended) ──

    public async Task DeleteLoginAttemptsAsync(int userId, CancellationToken ct = default)
    {
        var attempts = await _dbContext.LoginAttempts.Where(a => a.UserId == userId).ToListAsync(ct);
        _dbContext.LoginAttempts.RemoveRange(attempts);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<LoginAttempt>> GetAllLoginAttemptsAsync(CancellationToken ct = default)
        => await _dbContext.LoginAttempts.OrderByDescending(a => a.AttemptTime).ToListAsync(ct);

    public async Task<IEnumerable<LoginAttempt>> GetFailedAttemptsSinceAsync(DateTime since, CancellationToken ct = default)
        => await _dbContext.LoginAttempts.Where(a => !a.Success && a.AttemptTime > since).OrderByDescending(a => a.AttemptTime).ToListAsync(ct);

    public async Task<LoginAttempt?> GetLastFailedAttemptAsync(int userId, DateTime since, CancellationToken ct = default)
        => await _dbContext.LoginAttempts
            .Where(a => a.UserId == userId && !a.Success && a.AttemptTime > since)
            .OrderByDescending(a => a.AttemptTime)
            .FirstOrDefaultAsync(ct);

    // ── Captcha ──

    public async Task<int> SaveCaptchaAsync(AudioVerse.Domain.Entities.Auth.Captcha captcha, CancellationToken ct = default)
    {
        _dbContext.Captchas.Add(captcha);
        await _dbContext.SaveChangesAsync(ct);
        return captcha.Id;
    }

    public async Task<AudioVerse.Domain.Entities.Auth.Captcha?> GetCaptchaByIdAsync(int id, CancellationToken ct = default)
        => await _dbContext.Captchas.FindAsync([id], ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await _dbContext.SaveChangesAsync(ct);

    // ── Honey Tokens ──

    public async Task<int> AddHoneyTokenAsync(AudioVerse.Domain.Entities.Admin.HoneyToken token, CancellationToken ct = default)
    {
        _dbContext.HoneyTokens.Add(token);
        await _dbContext.SaveChangesAsync(ct);
        return token.Id;
    }

    public async Task<AudioVerse.Domain.Entities.Admin.HoneyToken?> GetHoneyTokenByIdAsync(int id, CancellationToken ct = default)
        => await _dbContext.HoneyTokens.FindAsync([id], ct);

    public async Task<IEnumerable<AudioVerse.Domain.Entities.Admin.HoneyToken>> GetAllHoneyTokensAsync(CancellationToken ct = default)
        => await _dbContext.HoneyTokens.OrderByDescending(t => t.CreatedAt).ToListAsync(ct);

    public async Task<IEnumerable<AudioVerse.Domain.Entities.Admin.HoneyToken>> GetTriggeredHoneyTokensAsync(CancellationToken ct = default)
        => await _dbContext.HoneyTokens.Where(t => t.IsTriggered).OrderByDescending(t => t.TriggeredAt).ToListAsync(ct);
}
