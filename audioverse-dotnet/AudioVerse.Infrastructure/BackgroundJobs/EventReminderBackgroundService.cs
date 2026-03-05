using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.BackgroundJobs;

/// <summary>
/// Sends event reminders (1 hour and 1 day before start) as in-app notifications.
/// Runs every 15 minutes.
/// </summary>
public class EventReminderBackgroundService(IServiceProvider services, ILogger<EventReminderBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        logger.LogInformation("EventReminderBackgroundService started, interval: {Interval}", Interval);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(Interval, ct);
                await SendRemindersAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Event reminder job failed");
            }
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var now = DateTime.UtcNow;

        // Events starting in 55-75 minutes (1h reminder window)
        var oneHourFrom = now.AddMinutes(55);
        var oneHourTo = now.AddMinutes(75);

        var upcomingEvents = await db.Events
            .Where(e => e.StartTime >= oneHourFrom && e.StartTime <= oneHourTo)
            .Select(e => new { e.Id, e.Title, e.StartTime })
            .ToListAsync(ct);

        foreach (var ev in upcomingEvents)
        {
            var participantIds = await db.KaraokeEventPlayers
                .Where(p => p.EventId == ev.Id)
                .Select(p => p.PlayerId)
                .ToListAsync(ct);

            foreach (var playerId in participantIds)
            {
                // Check if reminder already sent
                var alreadySent = await db.Notifications.AnyAsync(n =>
                    n.UserId == playerId &&
                    n.Type == Domain.Enums.NotificationType.EventReminder &&
                    n.EntityId == ev.Id &&
                    n.CreatedAt > now.AddHours(-2), ct);

                if (!alreadySent)
                {
                    db.Notifications.Add(new Domain.Entities.Notification
                    {
                        UserId = playerId,
                        Title = "Przypomnienie o evencie",
                        Body = $"'{ev.Title}' zaczyna się za ~1 godzinę ({ev.StartTime:HH:mm UTC})",
                        Type = Domain.Enums.NotificationType.EventReminder,
                        EntityId = ev.Id,
                        CreatedAt = now
                    });
                }
            }
        }

        var saved = await db.SaveChangesAsync(ct);
        if (saved > 0)
            logger.LogInformation("Sent {Count} event reminders", saved);
    }
}
