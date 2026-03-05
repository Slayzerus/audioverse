using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Services.Events;

public class EventNotificationService(
    IEventSubscriptionRepository subscriptionRepo,
    INotificationRepository notificationRepo) : IEventNotificationService
{
    public async Task NotifySubscribersAsync(int eventId, EventNotificationCategory category,
        string title, string body, NotificationType type, CancellationToken ct = default)
    {
        var subscribers = await subscriptionRepo.GetSubscribersForCategoryAsync(eventId, category, ct);

        foreach (var sub in subscribers)
        {
            var notification = new Notification
            {
                UserId = sub.UserId,
                Title = title,
                Body = body,
                Type = type,
                EntityId = eventId
            };
            await notificationRepo.AddAsync(notification);
        }
    }

    public async Task ProcessRemindersAsync(CancellationToken ct = default)
    {
        // 24h reminders
        var pending24h = await subscriptionRepo.GetPendingReminders24hAsync(ct);
        foreach (var sub in pending24h)
        {
            if (!sub.GetEffectiveCategories().HasFlag(EventNotificationCategory.Reminder24h))
                continue;

            var notification = new Notification
            {
                UserId = sub.UserId,
                Title = $"Przypomnienie: {sub.Event.Title} jutro!",
                Body = sub.Event.StartTime.HasValue
                    ? $"Event \"{sub.Event.Title}\" zaczyna się {sub.Event.StartTime.Value:dd.MM.yyyy HH:mm}"
                    : $"Event \"{sub.Event.Title}\" zaczyna się jutro",
                Type = NotificationType.EventReminder,
                EntityId = sub.EventId
            };
            await notificationRepo.AddAsync(notification);
            await subscriptionRepo.MarkReminderSentAsync(sub.Id, is24h: true, ct);
        }

        // 1h reminders
        var pending1h = await subscriptionRepo.GetPendingReminders1hAsync(ct);
        foreach (var sub in pending1h)
        {
            if (!sub.GetEffectiveCategories().HasFlag(EventNotificationCategory.Reminder1h))
                continue;

            var notification = new Notification
            {
                UserId = sub.UserId,
                Title = $"Za godzinę: {sub.Event.Title}",
                Body = sub.Event.StartTime.HasValue
                    ? $"Event \"{sub.Event.Title}\" zaczyna się o {sub.Event.StartTime.Value:HH:mm}"
                    : $"Event \"{sub.Event.Title}\" zaczyna się za godzinę!",
                Type = NotificationType.EventReminder,
                EntityId = sub.EventId
            };
            await notificationRepo.AddAsync(notification);
            await subscriptionRepo.MarkReminderSentAsync(sub.Id, is24h: false, ct);
        }
    }
}
