using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Notifications;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>
/// Wysyła masowe zaproszenia: tworzy EventInvite per kontakt,
/// a powiadomienia (InApp + Email + SMS) kolejkuje przez RabbitMQ.
/// Wyciąga ContactEmail[Personal] i ContactPhone[Mobile] z kontaktów.
/// </summary>
public class SendBulkInvitesHandler(
    IEventRepository eventRepo,
    INotificationDispatcher dispatcher) : IRequestHandler<SendBulkInvitesCommand, int>
{
    public async Task<int> Handle(SendBulkInvitesCommand req, CancellationToken ct)
    {
        var template = await eventRepo.GetInviteTemplateByIdAsync(req.TemplateId);
        if (template == null) return 0;

        var ev = await eventRepo.GetEventByIdAsync(req.EventId);
        var eventName = ev?.Title ?? "Event";
        var eventDate = ev?.StartTime?.ToString("dd.MM.yyyy HH:mm") ?? "";

        // Create tracking job
        var job = new BulkInviteJob
        {
            EventId = req.EventId,
            TemplateId = req.TemplateId,
            CreatedByUserId = req.UserId,
            TotalContacts = req.ContactIds.Length,
            Status = BulkInviteStatus.InProgress
        };
        await eventRepo.AddBulkInviteJobAsync(job);

        // Load contacts with emails and phones in one query
        var contacts = (await eventRepo.GetContactsByIdsAsync(req.ContactIds, ct)).ToList();

        var messages = new List<NotificationMessage>(contacts.Count);

        foreach (var contact in contacts)
        {
            var guestName = !string.IsNullOrEmpty(contact.DisplayName)
                ? contact.DisplayName
                : $"{contact.FirstName} {contact.LastName}".Trim();

            var email = contact.Emails
                .OrderByDescending(e => e.Type == ContactEmailType.Personal)
                .ThenByDescending(e => e.IsPrimary)
                .Select(e => e.Email)
                .FirstOrDefault();

            var phone = contact.Phones
                .Where(p => p.Type == ContactPhoneType.Mobile)
                .OrderByDescending(p => p.IsPrimary)
                .Select(p => p.PhoneNumber)
                .FirstOrDefault();

            // Create EventInvite record
            var invite = new EventInvite
            {
                EventId = req.EventId,
                FromUserId = req.UserId,
                ToEmail = email,
                Message = Render(template.NotificationTemplate, guestName, eventName, eventDate),
                Status = EventInviteStatus.Pending
            };

            // Link to system user if available
            if (contact.LinkedUserId.HasValue)
                invite.ToUserId = contact.LinkedUserId;

            await eventRepo.AddEventInviteAsync(invite, ct);

            // Build notification channels
            var channels = NotificationChannel.None;
            if (contact.LinkedUserId.HasValue && !string.IsNullOrEmpty(template.NotificationTemplate))
                channels |= NotificationChannel.InApp;
            if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(template.EmailTemplate))
                channels |= NotificationChannel.Email;
            if (!string.IsNullOrEmpty(phone) && !string.IsNullOrEmpty(template.SmsTemplate))
                channels |= NotificationChannel.Sms;

            if (channels != NotificationChannel.None)
            {
                messages.Add(new NotificationMessage
                {
                    UserId = contact.LinkedUserId,
                    Title = Render(template.EmailSubjectTemplate ?? "Zaproszenie: {EventName}", guestName, eventName, eventDate),
                    Body = Render(template.NotificationTemplate ?? template.SmsTemplate ?? "", guestName, eventName, eventDate),
                    HtmlBody = !string.IsNullOrEmpty(template.EmailTemplate) ? Render(template.EmailTemplate, guestName, eventName, eventDate) : null,
                    Email = (channels.HasFlag(NotificationChannel.Email)) ? email : null,
                    PhoneNumber = (channels.HasFlag(NotificationChannel.Sms)) ? phone : null,
                    Channels = channels,
                    Category = "EventInvite"
                });
            }
        }

        // Batch save all invites
        await eventRepo.SaveChangesAsync(ct);

        // Enqueue all notifications to RabbitMQ (non-blocking)
        if (messages.Count > 0)
            await dispatcher.EnqueueBatchAsync(messages, ct);

        // Update job status
        job.Sent = messages.Count;
        job.Status = BulkInviteStatus.Completed;
        job.CompletedAt = DateTime.UtcNow;
        await eventRepo.UpdateBulkInviteJobAsync(job);

        return job.Id;
    }

    private static string Render(string? template, string guestName, string eventName, string eventDate)
    {
        if (string.IsNullOrEmpty(template)) return "";
        return template
            .Replace("{GuestName}", guestName)
            .Replace("{EventName}", eventName)
            .Replace("{EventDate}", eventDate);
    }
}
