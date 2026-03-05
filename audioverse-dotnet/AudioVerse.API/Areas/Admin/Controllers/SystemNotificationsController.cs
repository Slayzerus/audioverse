using AudioVerse.Infrastructure.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Admin.Controllers;

/// <summary>
/// System notifications — send via any channel (in-app, email, SMS) through RabbitMQ queue.
/// </summary>
[ApiController]
[Route("api/system/notifications")]
[Authorize]
[Tags("System - Notifications")]
public class SystemNotificationsController : ControllerBase
{
    private readonly INotificationDispatcher _dispatcher;

    public SystemNotificationsController(INotificationDispatcher dispatcher) => _dispatcher = dispatcher;

    /// <summary>Send a single notification (queued via RabbitMQ).</summary>
    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] NotificationMessage message)
    {
        await _dispatcher.EnqueueAsync(message);
        return Ok(new { Success = true, Queued = 1 });
    }

    /// <summary>Send batch notifications (queued via RabbitMQ).</summary>
    [HttpPost("send-batch")]
    public async Task<IActionResult> SendBatch([FromBody] NotificationMessage[] messages)
    {
        await _dispatcher.EnqueueBatchAsync(messages);
        return Ok(new { Success = true, Queued = messages.Length });
    }

    /// <summary>Send a test email (admin only).</summary>
    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromQuery] string to, [FromQuery] string? subject)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        await _dispatcher.EnqueueAsync(new NotificationMessage
        {
            Title = subject ?? "Test AudioVerse",
            Body = "To jest testowa wiadomość email z systemu AudioVerse.",
            HtmlBody = "<h1>Test AudioVerse</h1><p>To jest testowa wiadomość email.</p>",
            Email = to,
            Channels = NotificationChannel.Email
        });
        return Ok(new { Success = true, SentTo = to });
    }

    /// <summary>Send a test SMS (admin only, requires SMSAPI token).</summary>
    [HttpPost("test-sms")]
    public async Task<IActionResult> TestSms([FromQuery] string phone, [FromQuery] string? message)
    {
        if (!User.IsInRole("Admin")) return Forbid();
        await _dispatcher.EnqueueAsync(new NotificationMessage
        {
            Title = "Test SMS",
            Body = message ?? "Test SMS z AudioVerse",
            PhoneNumber = phone,
            Channels = NotificationChannel.Sms
        });
        return Ok(new { Success = true, SentTo = phone });
    }
}
