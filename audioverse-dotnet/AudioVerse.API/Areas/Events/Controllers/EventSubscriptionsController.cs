using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.API.Models.Requests.Events;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event subscriptions — observe events, manage notification levels and categories.
    /// Users choose between Essential (cancellations only), Standard (+ reminders),
    /// or All (+ news, hype, comments) — or fine-tune individual categories.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EventSubscriptionsController(IMediator mediator) : ControllerBase
    {
        /// <summary>Get the current user's subscription for a specific event.</summary>
        [HttpGet("events/{eventId:int}")]
        public async Task<IActionResult> GetSubscription(int eventId)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var sub = await mediator.Send(new GetEventSubscriptionQuery(userId, eventId));
            return sub == null ? NotFound() : Ok(sub);
        }

        /// <summary>Check if current user is subscribed to an event.</summary>
        [HttpGet("events/{eventId:int}/check")]
        public async Task<IActionResult> IsSubscribed(int eventId)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var subscribed = await mediator.Send(new IsSubscribedQuery(userId, eventId));
            return Ok(new { isSubscribed = subscribed });
        }

        /// <summary>Get all subscriptions for the current user.</summary>
        [HttpGet("my")]
        public async Task<IActionResult> GetMySubscriptions()
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            return Ok(await mediator.Send(new GetUserSubscriptionsQuery(userId)));
        }

        /// <summary>Get all subscribers for an event (organizer view).</summary>
        [HttpGet("events/{eventId:int}/subscribers")]
        public async Task<IActionResult> GetSubscribers(int eventId)
            => Ok(await mediator.Send(new GetEventSubscribersQuery(eventId)));

        /// <summary>Subscribe to an event with a chosen notification level.</summary>
        [HttpPost]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeToEventRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var id = await mediator.Send(new SubscribeToEventCommand(userId, req.EventId, req.Level, req.EmailEnabled, req.PushEnabled));
            return Ok(new { subscriptionId = id });
        }

        /// <summary>Update notification preferences for an existing subscription.</summary>
        [HttpPut("events/{eventId:int}")]
        public async Task<IActionResult> UpdatePreferences(int eventId, [FromBody] UpdateSubscriptionRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var ok = await mediator.Send(new UpdateEventSubscriptionCommand(
                userId, eventId, req.Level, req.CustomCategories, req.EmailEnabled, req.PushEnabled));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>Unsubscribe from an event.</summary>
        [HttpDelete("events/{eventId:int}")]
        public async Task<IActionResult> Unsubscribe(int eventId)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            return await mediator.Send(new UnsubscribeFromEventCommand(userId, eventId)) ? NoContent() : NotFound();
        }

        /// <summary>Toggle subscription on/off. Returns true if now subscribed.</summary>
        [HttpPost("events/{eventId:int}/toggle")]
        public async Task<IActionResult> Toggle(int eventId)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var isNowSubscribed = await mediator.Send(new ToggleEventSubscriptionCommand(userId, eventId));
            return Ok(new { isSubscribed = isNowSubscribed });
        }

        /// <summary>Bulk-subscribe to all events in an EventList.</summary>
        [HttpPost("lists/{listId:int}/subscribe")]
        public async Task<IActionResult> SubscribeToList(int listId, [FromBody] SubscribeToListRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var count = await mediator.Send(new SubscribeToEventListCommand(userId, listId, req.Level));
            return Ok(new { subscribed = count });
        }

        /// <summary>Set IsObserved flag on an EventListItem — auto-creates/removes subscription.</summary>
        [HttpPut("list-items/{itemId:int}/observe")]
        public async Task<IActionResult> SetObserved(int itemId, [FromBody] SetObservedRequest req)
        {
            var userId = int.Parse(User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value ?? "0");
            var ok = await mediator.Send(new SetEventListItemObservedCommand(itemId, userId, req.IsObserved, req.Level));
            return ok ? NoContent() : NotFound();
        }
    }
}
