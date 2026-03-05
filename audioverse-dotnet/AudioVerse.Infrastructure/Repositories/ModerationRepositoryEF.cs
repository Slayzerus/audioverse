using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IModerationRepository.
/// Handles abuse reports, captchas, and honey tokens.
/// </summary>
public class ModerationRepositoryEF : IModerationRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<ModerationRepositoryEF> _logger;

    public ModerationRepositoryEF(AudioVerseDbContext dbContext, ILogger<ModerationRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  ABUSE REPORTS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> CreateReportAsync(AbuseReport report)
    {
        report.CreatedAt = DateTime.UtcNow;
        _dbContext.AbuseReports.Add(report);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Abuse report created: {Id}, TargetType: {TargetType}", report.Id, report.TargetType);
        return report.Id;
    }

    /// <inheritdoc />
    public async Task<AbuseReport?> GetReportByIdAsync(int id)
    {
        return await _dbContext.AbuseReports
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AbuseReport>> GetPendingReportsAsync(int page = 1, int pageSize = 20)
    {
        return await _dbContext.AbuseReports
            .Where(r => !r.Resolved)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AbuseReport>> GetReportsAsync(
        bool? isResolved = null,
        string? contentType = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _dbContext.AbuseReports.AsQueryable();

        if (isResolved.HasValue)
            query = query.Where(r => r.Resolved == isResolved.Value);
        
        if (!string.IsNullOrEmpty(contentType))
            query = query.Where(r => r.TargetType == contentType);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> ResolveReportAsync(int id, int resolvedByUserId, string resolution)
    {
        var report = await _dbContext.AbuseReports.FindAsync(id);
        if (report == null) return false;

        report.Resolved = true;
        report.ResolvedAt = DateTime.UtcNow;
        report.ModeratorComment = resolution;

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Abuse report {Id} resolved by user {UserId}", id, resolvedByUserId);
        return true;
    }

    /// <inheritdoc />
    public async Task<int> GetReportCountAsync(bool? isResolved = null, string? contentType = null)
    {
        var query = _dbContext.AbuseReports.AsQueryable();

        if (isResolved.HasValue)
            query = query.Where(r => r.Resolved == isResolved.Value);
        
        if (!string.IsNullOrEmpty(contentType))
            query = query.Where(r => r.TargetType == contentType);

        return await query.CountAsync();
    }

    // ????????????????????????????????????????????????????????????
    //  CAPTCHAS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> CreateCaptchaAsync(Captcha captcha)
    {
        captcha.CreatedAt = DateTime.UtcNow;
        _dbContext.Captchas.Add(captcha);
        await _dbContext.SaveChangesAsync();
        return captcha.Id;
    }

    /// <inheritdoc />
    public async Task<Captcha?> GetCaptchaAsync(string token)
    {
        // Token is stored in Challenge field or we need to match by Id
        return await _dbContext.Captchas
            .FirstOrDefaultAsync(c => c.Challenge == token && !c.IsUsed && c.ExpiresAt > DateTime.UtcNow);
    }

    /// <inheritdoc />
    public async Task<bool> MarkCaptchaSolvedAsync(string token)
    {
        var captcha = await _dbContext.Captchas
            .FirstOrDefaultAsync(c => c.Challenge == token);
        
        if (captcha == null) return false;

        captcha.IsUsed = true;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<int> DeleteExpiredCaptchasAsync()
    {
        var expired = await _dbContext.Captchas
            .Where(c => c.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        if (expired.Count == 0) return 0;

        _dbContext.Captchas.RemoveRange(expired);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Deleted {Count} expired captchas", expired.Count);
        return expired.Count;
    }

    // ????????????????????????????????????????????????????????????
    //  HONEY TOKENS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> CreateHoneyTokenAsync(HoneyToken token)
    {
        token.CreatedAt = DateTime.UtcNow;
        _dbContext.HoneyTokens.Add(token);
        await _dbContext.SaveChangesAsync();
        return token.Id;
    }

    /// <inheritdoc />
    public async Task<HoneyToken?> GetHoneyTokenAsync(string token)
    {
        return await _dbContext.HoneyTokens
            .FirstOrDefaultAsync(h => h.TokenId == token);
    }

    /// <inheritdoc />
    public async Task<bool> RecordHoneyTokenAccessAsync(int tokenId, string? ipAddress)
    {
        var token = await _dbContext.HoneyTokens.FindAsync(tokenId);
        if (token == null) return false;

        token.IsTriggered = true;
        token.TriggeredAt = DateTime.UtcNow;
        token.TriggeredFrom = ipAddress;

        await _dbContext.SaveChangesAsync();
        _logger.LogWarning("Honey token {TokenId} triggered from IP {IpAddress}", token.TokenId, ipAddress);
        return true;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<HoneyToken>> GetAllHoneyTokensAsync()
    {
        return await _dbContext.HoneyTokens
            .OrderByDescending(h => h.IsTriggered)
            .ThenByDescending(h => h.TriggeredAt)
            .ToListAsync();
    }
}
