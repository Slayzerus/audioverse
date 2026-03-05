using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

public class EventSubscriptionRepositoryEF(AudioVerseDbContext db) : IEventSubscriptionRepository
{
    public async Task<EventSubscription?> GetAsync(int userId, int eventId, CancellationToken ct = default)
        => await db.EventSubscriptions.FirstOrDefaultAsync(s => s.UserId == userId && s.EventId == eventId, ct);

    public async Task<EventSubscription?> GetByIdAsync(int id, CancellationToken ct = default)
        => await db.EventSubscriptions.FindAsync([id], ct);

    public async Task<IEnumerable<EventSubscription>> GetByUserAsync(int userId, CancellationToken ct = default)
        => await db.EventSubscriptions.Include(s => s.Event)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<EventSubscription>> GetByEventAsync(int eventId, CancellationToken ct = default)
        => await db.EventSubscriptions
            .Where(s => s.EventId == eventId)
            .ToListAsync(ct);

    public async Task<IEnumerable<EventSubscription>> GetSubscribersForCategoryAsync(
        int eventId, EventNotificationCategory category, CancellationToken ct = default)
    {
        var all = await db.EventSubscriptions
            .Where(s => s.EventId == eventId && s.Level != EventNotificationLevel.Muted)
            .ToListAsync(ct);

        return all.Where(s => s.GetEffectiveCategories().HasFlag(category));
    }

    public async Task<IEnumerable<EventSubscription>> GetPendingReminders24hAsync(CancellationToken ct = default)
    {
        var windowStart = DateTime.UtcNow.AddHours(23);
        var windowEnd = DateTime.UtcNow.AddHours(25);

        return await db.EventSubscriptions
            .Include(s => s.Event)
            .Where(s => !s.Reminder24hSent
                && s.Level != EventNotificationLevel.Muted
                && s.Event.StartTime.HasValue
                && s.Event.StartTime.Value >= windowStart
                && s.Event.StartTime.Value <= windowEnd)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EventSubscription>> GetPendingReminders1hAsync(CancellationToken ct = default)
    {
        var windowStart = DateTime.UtcNow.AddMinutes(50);
        var windowEnd = DateTime.UtcNow.AddMinutes(70);

        return await db.EventSubscriptions
            .Include(s => s.Event)
            .Where(s => !s.Reminder1hSent
                && s.Level != EventNotificationLevel.Muted
                && s.Event.StartTime.HasValue
                && s.Event.StartTime.Value >= windowStart
                && s.Event.StartTime.Value <= windowEnd)
            .ToListAsync(ct);
    }

    public async Task<int> CreateAsync(EventSubscription subscription, CancellationToken ct = default)
    {
        db.EventSubscriptions.Add(subscription);
        await db.SaveChangesAsync(ct);
        return subscription.Id;
    }

    public async Task<bool> UpdateAsync(EventSubscription subscription, CancellationToken ct = default)
    {
        var existing = await db.EventSubscriptions.FindAsync([subscription.Id], ct);
        if (existing == null) return false;

        existing.Level = subscription.Level;
        existing.CustomCategories = subscription.CustomCategories;
        existing.EmailEnabled = subscription.EmailEnabled;
        existing.PushEnabled = subscription.PushEnabled;
        existing.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int userId, int eventId, CancellationToken ct = default)
    {
        var sub = await db.EventSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.EventId == eventId, ct);
        if (sub == null) return false;
        db.EventSubscriptions.Remove(sub);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ToggleAsync(int userId, int eventId,
        EventNotificationLevel defaultLevel = EventNotificationLevel.Standard, CancellationToken ct = default)
    {
        var existing = await db.EventSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.EventId == eventId, ct);

        if (existing != null)
        {
            db.EventSubscriptions.Remove(existing);
            await db.SaveChangesAsync(ct);
            return false;
        }

        db.EventSubscriptions.Add(new EventSubscription
        {
            UserId = userId,
            EventId = eventId,
            Level = defaultLevel
        });
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task MarkReminderSentAsync(int subscriptionId, bool is24h, CancellationToken ct = default)
    {
        var sub = await db.EventSubscriptions.FindAsync([subscriptionId], ct);
        if (sub == null) return;

        if (is24h) sub.Reminder24hSent = true;
        else sub.Reminder1hSent = true;

        await db.SaveChangesAsync(ct);
    }

    public async Task<int> SubscribeToListEventsAsync(int userId, int eventListId,
        EventNotificationLevel level, CancellationToken ct = default)
    {
        var eventIds = await db.EventListItems
            .Where(i => i.EventListId == eventListId)
            .Select(i => i.EventId)
            .ToListAsync(ct);

        var alreadySubscribed = await db.EventSubscriptions
            .Where(s => s.UserId == userId && eventIds.Contains(s.EventId))
            .Select(s => s.EventId)
            .ToListAsync(ct);

        var newSubs = eventIds
            .Where(id => !alreadySubscribed.Contains(id))
            .Select(id => new EventSubscription
            {
                UserId = userId,
                EventId = id,
                Level = level
            }).ToList();

        db.EventSubscriptions.AddRange(newSubs);
        await db.SaveChangesAsync(ct);
        return newSubs.Count;
    }
}
