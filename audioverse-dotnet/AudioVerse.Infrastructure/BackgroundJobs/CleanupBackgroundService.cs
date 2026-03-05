using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.BackgroundJobs;

/// <summary>
/// Periodic cleanup job running every hour.
/// Removes expired tokens, old read notifications, and orphaned audit entries.
/// </summary>
public class CleanupBackgroundService(IServiceProvider services, ILogger<CleanupBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("CleanupBackgroundService started, interval: {Interval}", Interval);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, ct);
                await RunCleanupAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Cleanup job failed");
            }
        }
    }

    private async Task RunCleanupAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var cutoff = DateTime.UtcNow;

        // 1. Expired OTPs (older than 24h)
        var otpCutoff = cutoff.AddHours(-24);
        var expiredOtps = await db.OneTimePasswords
            .Where(o => o.ExpiresAt < otpCutoff)
            .ExecuteDeleteAsync(ct);

        // 2. Read notifications older than 30 days
        var notifCutoff = cutoff.AddDays(-30);
        var oldNotifs = await db.Notifications
            .Where(n => n.IsRead && n.CreatedAt < notifCutoff)
            .ExecuteDeleteAsync(ct);

        // 3. Old entity change logs (older than 90 days)
        var auditCutoff = cutoff.AddDays(-90);
        var oldLogs = await db.EntityChangeLogs
            .Where(e => e.Timestamp < auditCutoff)
            .ExecuteDeleteAsync(ct);

        if (expiredOtps > 0 || oldNotifs > 0 || oldLogs > 0)
        {
            logger.LogInformation(
                "Cleanup completed: {Otps} expired OTPs, {Notifs} old notifications, {Logs} old audit logs removed",
                expiredOtps, oldNotifs, oldLogs);
        }
    }
}
