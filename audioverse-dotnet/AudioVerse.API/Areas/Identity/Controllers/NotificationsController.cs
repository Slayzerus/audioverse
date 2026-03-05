using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AudioVerse.API.Areas.Identity.Controllers;

[ApiController]
[Route("api/user/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IHubContext<Hubs.NotificationHub> _hub;

    public NotificationsController(IMediator mediator, IHubContext<Hubs.NotificationHub> hub)
    {
        _mediator = mediator;
        _hub = hub;
    }

    private int GetUserId() => int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    /// <summary>Get notifications for the current user</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        => Ok(await _mediator.Send(new GetUserNotificationsQuery(GetUserId(), unreadOnly)));

    /// <summary>Get unread notification count</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
        => Ok(new { Count = await _mediator.Send(new GetUnreadNotificationCountQuery(GetUserId())) });

    /// <summary>Mark a notification as read</summary>
    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
        => await _mediator.Send(new MarkNotificationReadCommand(id)) ? Ok(new { Success = true }) : NotFound();

    /// <summary>Mark all notifications as read</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var count = await _mediator.Send(new MarkAllNotificationsReadCommand(GetUserId()));
        return Ok(new { MarkedCount = count });
    }

    /// <summary>Delete a notification</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => await _mediator.Send(new DeleteNotificationCommand(id)) ? NoContent() : NotFound();

    /// <summary>Send a notification (admin/system use)</summary>
    [HttpPost]
    public async Task<IActionResult> Send([FromBody] Notification notification)
    {
        notification.CreatedAt = DateTime.UtcNow;
        var id = await _mediator.Send(new SendNotificationCommand(notification));

        await _hub.Clients.Group($"user_{notification.UserId}")
            .SendAsync("NotificationReceived", new { notification.Id, notification.Title, notification.Body, notification.Type });

        return Created($"/api/user/notifications/{id}", new { Id = id });
    }
}
