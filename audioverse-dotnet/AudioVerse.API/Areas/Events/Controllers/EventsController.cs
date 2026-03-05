using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using AudioVerse.API.Models.Requests.Events;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event management - create, update, delete events.
    /// Manage participants, schedule, menu, attractions, board games, and video games.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Produces("application/json")]
    [Tags("Events")]
    public class EventsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IEventRepository _eventRepo;
        private readonly AudioVerse.API.Services.EventPdfExportService _pdfExport;

        public EventsController(IMediator mediator, IEventRepository eventRepo, AudioVerse.API.Services.EventPdfExportService pdfExport)
        {
            _mediator = mediator;
            _eventRepo = eventRepo;
        }

        /// <summary>
        /// List events with filtering, sorting, and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(AudioVerse.Application.Models.Common.PagedResult<Event>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEvents([FromQuery] AudioVerse.Application.Models.Requests.Events.EventFilterRequest filter)
        {
            var result = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventsPagedQuery(filter));
            return Ok(result);
        }

        /// <summary>Get distinct event organizers (Id + Name) for dropdown filters.</summary>
        [HttpGet("organizers")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<AudioVerse.Application.Models.Dtos.EventOrganizerDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOrganizers()
        {
            var organizers = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetDistinctOrganizersQuery());
            return Ok(organizers);
        }

        /// <summary>
        /// Create a new event (JSON body).
        /// </summary>
        /// <param name="ev">Event data</param>
        /// <returns>Created event ID</returns>
        [HttpPost]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateEvent([FromBody] Event ev)
        {
            if (ev == null) return BadRequest();
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.CreateEventCommand(ev));
            return CreatedAtAction(nameof(GetEvent), new { id = id }, new { EventId = id });
        }

        /// <summary>
        /// Create a new event (multipart form with optional poster image).
        /// </summary>
        [HttpPost("with-poster")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateEventForm([FromForm] CreateEventFormRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required.");

            // Default OrganizerId to the current user if not provided
            var organizerId = request.OrganizerId;
            if (!organizerId.HasValue)
            {
                var uid = User.FindFirst("id")?.Value;
                if (int.TryParse(uid, out var currentUserId))
                    organizerId = currentUserId;
            }

            var ev = new Event
            {
                Title = request.Name,
                Description = request.Description,
                OrganizerId = organizerId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Type = request.Type ?? Domain.Enums.Events.EventType.Event,
            };

            // Handle poster upload if provided
            if (request.Poster is { Length: > 0 })
            {
                var fs = HttpContext.RequestServices.GetService<IFileStorage>();
                if (fs != null)
                {
                    var ext = Path.GetExtension(request.Poster.FileName)?.ToLowerInvariant() ?? ".jpg";
                    var key = $"posters/{Guid.NewGuid()}{ext}";
                    await fs.EnsureBucketExistsAsync("ev-posters");
                    await using var stream = request.Poster.OpenReadStream();
                    await fs.UploadAsync("ev-posters", key, stream, request.Poster.ContentType ?? "image/jpeg");
                    ev.Poster = key;
                }
            }

            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.CreateEventCommand(ev));
            return CreatedAtAction(nameof(GetEvent), new { id = id }, new { EventId = id });
        }

        /// <summary>
        /// Get event by ID.
        /// </summary>
        /// <param name="id">Event ID</param>
        /// <returns>Event details</returns>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(Event), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEvent(int id)
        {
            var ev = await _mediator.Send(new GetEventByIdQuery(id));
            return ev != null ? Ok(ev) : NotFound();
        }

        /// <summary>
        /// Update an event (JSON body).
        /// </summary>
        /// <param name="id">Event ID</param>
        /// <param name="ev">Updated event data</param>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEvent(int id, [FromBody] Event ev)
        {
            if (ev == null || ev.Id != id) return BadRequest();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateEventCommand(ev));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Update an event (multipart form with optional poster image).
        /// </summary>
        [HttpPut("{id:int}/with-poster")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEventForm(int id, [FromForm] CreateEventFormRequest request)
        {
            var existing = await _mediator.Send(new GetEventByIdQuery(id));
            if (existing == null) return NotFound();

            existing.Title = request.Name;
            existing.Description = request.Description;
            existing.OrganizerId = request.OrganizerId ?? existing.OrganizerId;
            existing.StartTime = request.StartTime ?? existing.StartTime;
            existing.EndTime = request.EndTime ?? existing.EndTime;
            if (request.Type.HasValue) existing.Type = request.Type.Value;

            // Handle poster upload if provided
            if (request.Poster is { Length: > 0 })
            {
                var fs = HttpContext.RequestServices.GetService<IFileStorage>();
                if (fs != null)
                {
                    var ext = Path.GetExtension(request.Poster.FileName)?.ToLowerInvariant() ?? ".jpg";
                    var key = $"posters/{Guid.NewGuid()}{ext}";
                    await fs.EnsureBucketExistsAsync("ev-posters");
                    await using var stream = request.Poster.OpenReadStream();
                    await fs.UploadAsync("ev-posters", key, stream, request.Poster.ContentType ?? "image/jpeg");
                    existing.Poster = key;
                }
            }

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateEventCommand(existing));
            return ok ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete an event.
        /// </summary>
        /// <param name="id">Event ID</param>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventCommand(id));
            return ok ? NoContent() : NotFound();
        }

        /// <summary>
        /// Get the public URL for the event poster image.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>Public URL</returns>
        [HttpGet("{eventId:int}/poster-public-url")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEventPosterPublicUrl(int eventId)
        {
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            if (string.IsNullOrEmpty(ev.Poster)) return NotFound();
            var fs = HttpContext.RequestServices.GetService<IFileStorage>();
            if (fs == null) return StatusCode(500, "Storage not configured");
            var url = fs.GetPublicUrl("ev-posters", ev.Poster);
            return Ok(new { Url = url });
        }

        /// <summary>
        /// Serve the event poster image directly (proxied from MinIO).
        /// </summary>
        /// <param name="eventId">Event ID</param>
        [HttpGet("{eventId:int}/poster")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetEventPoster(int eventId)
        {
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null || string.IsNullOrEmpty(ev.Poster)) return NotFound();

            var fs = HttpContext.RequestServices.GetService<IFileStorage>();
            if (fs == null) return StatusCode(500, "Storage not configured");

            var stream = await fs.DownloadAsync("ev-posters", ev.Poster);
            if (stream == null) return NotFound();

            var ext = Path.GetExtension(ev.Poster)?.ToLowerInvariant();
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };

            return File(stream, contentType);
        }

        // ------------------------------------------------------------
        //  PARTICIPANTS
        // ------------------------------------------------------------

        /// <summary>
        /// Add a user as participant to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="request">Participant data (UserId)</param>
        [HttpPost("{eventId:int}/participants")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddParticipantToEvent(int eventId, [FromBody] AddParticipantRequest request)
        {
            if (request == null) return BadRequest();
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var isOrganizer = ev.OrganizerId.HasValue && ev.OrganizerId.Value == userId;
            var isAdmin = User.IsInRole("Admin");
            if (!isOrganizer && !isAdmin) return Forbid();

            var ok = await _mediator.Send(new AssignParticipantToEventCommand(eventId, request.UserId));
            return ok ? Ok(new { Success = true }) : StatusCode(500, new { Success = false });
        }

        /// <summary>
        /// Get all participants of an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        [HttpGet("{eventId:int}/participants")]
        [ProducesResponseType(typeof(IEnumerable<EventParticipant>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetParticipants(int eventId)
        {
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var participants = await _mediator.Send(new GetParticipantsByEventQuery(eventId));
            return Ok(participants);
        }

        /// <summary>Self-service RSVP — user signs up for an event.</summary>
        [HttpPost("{eventId:int}/rsvp")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RsvpToEvent(int eventId)
        {
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.RsvpToEventCommand(eventId, userId));
            return ok ? Ok(new { Success = true, Status = "Registered" }) : BadRequest(new { Success = false, Message = "Cannot RSVP" });
        }

        /// <summary>Participant announces arrival — moves from Registered to Waiting (bouncer queue).</summary>
        [HttpPost("{eventId:int}/arrive")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ArriveAtEvent(int eventId)
        {
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Events.ArriveAtEventCommand(eventId, userId));
            return ok ? Ok(new { Success = true, Status = "Waiting" }) : BadRequest(new { Success = false, Message = "Cannot mark arrival" });
        }

        /// <summary>
        /// Create an invite for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="invite">Invite data</param>
        [HttpPost("{eventId:int}/invites")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AddInviteToEvent(int eventId, [FromBody] EventInvite invite)
        {
            if (invite == null) return BadRequest();
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var isOrganizer = ev.OrganizerId.HasValue && ev.OrganizerId.Value == userId;
            var isAdmin = User.IsInRole("Admin");
            if (!isOrganizer && !isAdmin) return Forbid();

            invite.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddInviteToEventCommand(eventId, invite));
            return Ok(new { InviteId = id });
        }

        /// <summary>
        /// Create a karaoke session for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="session">Session data</param>
        [HttpPost("{eventId:int}/sessions")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AddSessionToEvent(int eventId, [FromBody] KaraokeSession session)
        {
            if (session == null) return BadRequest();
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var userIdStr = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdStr, out var userId)) return Unauthorized();
            var isOrganizer = ev.OrganizerId.HasValue && ev.OrganizerId.Value == userId;
            var isAdmin = User.IsInRole("Admin");
            if (!isOrganizer && !isAdmin) return Forbid();

            session.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddSessionToEventCommand(eventId, session));
            return Ok(new { SessionId = id });
        }

        // ------------------------------------------------------------
        //  SCHEDULE
        // ------------------------------------------------------------

        /// <summary>
        /// Add a schedule item to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="item">Schedule item data</param>
        [HttpPost("{eventId:int}/schedule")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddScheduleItem(int eventId, [FromBody] EventScheduleItem item)
        {
            if (item == null) return BadRequest();
            item.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddScheduleItemCommand(item));
            return CreatedAtAction(nameof(GetSchedule), new { eventId }, new { Id = id });
        }

        /// <summary>
        /// Get schedule for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>List of schedule items</returns>
        [HttpGet("{eventId:int}/schedule")]
        [ProducesResponseType(typeof(IEnumerable<EventScheduleItem>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSchedule(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetScheduleByEventQuery(eventId)));

        /// <summary>
        /// Update a schedule item.
        /// </summary>
        [HttpPut("{eventId:int}/schedule/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateScheduleItem(int eventId, int id, [FromBody] EventScheduleItem item)
        {
            if (item == null) return BadRequest();
            item.Id = id; item.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateScheduleItemCommand(item)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete a schedule item.
        /// </summary>
        [HttpDelete("{eventId:int}/schedule/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteScheduleItem(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteScheduleItemCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  TABS
        // ------------------------------------------------------------

        /// <summary>Get all tabs for an event (sorted by SortOrder).</summary>
        [HttpGet("{eventId:int}/tabs")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<EventTab>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTabs(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventTabsByEventQuery(eventId)));

        /// <summary>Add a tab to an event.</summary>
        [HttpPost("{eventId:int}/tabs")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddTab(int eventId, [FromBody] EventTab tab)
        {
            if (tab == null) return BadRequest();
            tab.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventTabCommand(tab));
            return CreatedAtAction(nameof(GetTabs), new { eventId }, new { Id = id });
        }

        /// <summary>Update a tab.</summary>
        [HttpPut("{eventId:int}/tabs/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateTab(int eventId, int id, [FromBody] EventTab tab)
        {
            if (tab == null) return BadRequest();
            tab.Id = id; tab.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateEventTabCommand(tab)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete a tab.</summary>
        [HttpDelete("{eventId:int}/tabs/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteTab(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventTabCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  MENU
        // ------------------------------------------------------------

        /// <summary>
        /// Add a menu item to an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="item">Menu item data</param>
        [HttpPost("{eventId:int}/menu")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddMenuItem(int eventId, [FromBody] EventMenuItem item)
        {
            if (item == null) return BadRequest();
            item.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddMenuItemCommand(item));
            return CreatedAtAction(nameof(GetMenu), new { eventId }, new { Id = id });
        }

        /// <summary>
        /// Get menu items for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>List of menu items</returns>
        [HttpGet("{eventId:int}/menu")]
        [ProducesResponseType(typeof(IEnumerable<EventMenuItem>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMenu(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetMenuByEventQuery(eventId)));

        /// <summary>
        /// Update a menu item.
        /// </summary>
        [HttpPut("{eventId:int}/menu/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateMenuItem(int eventId, int id, [FromBody] EventMenuItem item)
        {
            if (item == null) return BadRequest();
            item.Id = id; item.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateMenuItemCommand(item)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete a menu item.
        /// </summary>
        [HttpDelete("{eventId:int}/menu/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteMenuItem(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteMenuItemCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  ATTRACTIONS
        // ------------------------------------------------------------

        /// <summary>
        /// Add an attraction to an event.
        /// </summary>
        [HttpPost("{eventId:int}/attractions")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddAttraction(int eventId, [FromBody] EventAttraction item)
        {
            if (item == null) return BadRequest();
            item.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddAttractionCommand(item));
            return CreatedAtAction(nameof(GetAttractions), new { eventId }, new { Id = id });
        }

        /// <summary>
        /// Get attractions for an event.
        /// </summary>
        [HttpGet("{eventId:int}/attractions")]
        [ProducesResponseType(typeof(IEnumerable<EventAttraction>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAttractions(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetAttractionsByEventQuery(eventId)));

        /// <summary>
        /// Update an attraction.
        /// </summary>
        [HttpPut("{eventId:int}/attractions/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateAttraction(int eventId, int id, [FromBody] EventAttraction item)
        {
            if (item == null) return BadRequest();
            item.Id = id; item.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateAttractionCommand(item)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete an attraction.
        /// </summary>
        [HttpDelete("{eventId:int}/attractions/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAttraction(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteAttractionCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  EVENT BOARD GAMES
        // ------------------------------------------------------------

        /// <summary>
        /// Link a board game to an event.
        /// </summary>
        [HttpPost("{eventId:int}/board-games")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddEventBoardGame(int eventId, [FromBody] EventBoardGameSession link)
        {
            if (link == null) return BadRequest();
            link.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventBoardGameCommand(link));
            return CreatedAtAction(nameof(GetEventBoardGames), new { eventId }, new { Id = id });
        }

        /// <summary>
        /// Get board games linked to an event.
        /// </summary>
        [HttpGet("{eventId:int}/board-games")]
        [ProducesResponseType(typeof(IEnumerable<EventBoardGameSession>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEventBoardGames(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventBoardGamesQuery(eventId)));

        /// <summary>
        /// Update board game link for an event.
        /// </summary>
        [HttpPut("{eventId:int}/board-games/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEventBoardGame(int eventId, int id, [FromBody] EventBoardGameSession link)
        {
            if (link == null) return BadRequest();
            link.Id = id; link.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateEventBoardGameCommand(link)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Remove board game from event.
        /// </summary>
        [HttpDelete("{eventId:int}/board-games/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteEventBoardGame(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventBoardGameCommand(id)) ? NoContent() : NotFound();

        // ------------------------------------------------------------
        //  EVENT VIDEO GAMES
        // ------------------------------------------------------------

        /// <summary>
        /// Link a video game to an event.
        /// </summary>
        [HttpPost("{eventId:int}/video-games")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddEventVideoGame(int eventId, [FromBody] EventVideoGameSession link)
        {
            if (link == null) return BadRequest();
            link.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventVideoGameCommand(link));
            return CreatedAtAction(nameof(GetEventVideoGames), new { eventId }, new { Id = id });
        }

        /// <summary>
        /// Get video games linked to an event.
        /// </summary>
        [HttpGet("{eventId:int}/video-games")]
        [ProducesResponseType(typeof(IEnumerable<EventVideoGameSession>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetEventVideoGames(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventVideoGamesQuery(eventId)));

        /// <summary>
        /// Update video game link for an event.
        /// </summary>
        [HttpPut("{eventId:int}/video-games/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateEventVideoGame(int eventId, int id, [FromBody] EventVideoGameSession link)
        {
            if (link == null) return BadRequest();
            link.Id = id; link.EventId = eventId;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateEventVideoGameCommand(link)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Remove video game from event.
        /// </summary>
        [HttpDelete("{eventId:int}/video-games/{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteEventVideoGame(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventVideoGameCommand(id)) ? NoContent() : NotFound();

        // ════════════════════════════════════════════════════════════
        //  COMMENTS / WALL
        // ════════════════════════════════════════════════════════════

        /// <summary>Add a comment to an event</summary>
        [HttpPost("{eventId:int}/comments")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddComment(int eventId, [FromBody] AudioVerse.Domain.Entities.Events.EventComment comment)
        {
            comment.EventId = eventId;
            comment.CreatedAt = DateTime.UtcNow;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventCommentCommand(comment));
            return Created($"/api/events/{eventId}/comments/{id}", new { Id = id });
        }

        /// <summary>Get comments for an event (top-level with replies)</summary>
        [HttpGet("{eventId:int}/comments")]
        public async Task<IActionResult> GetComments(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventCommentsQuery(eventId)));

        /// <summary>Delete a comment</summary>
        [HttpDelete("{eventId:int}/comments/{id:int}")]
        public async Task<IActionResult> DeleteComment(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventCommentCommand(id)) ? NoContent() : NotFound();

        //  LINK ACCESS (1.9)
        // ──────────────────────────────────────────────────

        /// <summary>Generate a shareable access link token for the event's party</summary>
        [HttpPost("{eventId}/generate-link")]
        public async Task<IActionResult> GenerateAccessLink(int eventId)
        {
            var ev = await _mediator.Send(new GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            ev.Access = AudioVerse.Domain.Enums.EventAccessType.Link;
            ev.AccessToken = Guid.NewGuid().ToString("N");
            await _eventRepo.UpdateEventAsync(ev);
            return Ok(new { Token = ev.AccessToken, Link = $"/api/events/join/{ev.AccessToken}" });
        }

        /// <summary>Join an event via access link token (no auth required)</summary>
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        [HttpGet("/api/events/join/{token}")]
        public async Task<IActionResult> JoinViaLink(string token)
        {
            var ev = await _eventRepo.FindByAccessTokenAsync(token);
            if (ev == null) return NotFound(new { Message = "Invalid or expired link" });
            return Ok(new { EventId = ev.Id, EventName = ev.Name, Access = ev.Access.ToString() });
        }

        /// <summary>Validate a party code for Code-access events</summary>
        [HttpPost("{eventId}/validate-code")]
        public async Task<IActionResult> ValidateCode(int eventId, [FromBody] ValidateCodeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code)) return BadRequest();
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByEventIdQuery(eventId));
            if (ev == null) return NotFound();
            if (ev.Access != AudioVerse.Domain.Enums.EventAccessType.Code) return BadRequest(new { Message = "Event does not use code access" });
            var valid = ev.CodeHash == request.Code || ev.CodeHash == AudioVerse.Infrastructure.Helpers.HashHelper.Sha256(request.Code);
            return valid ? Ok(new { Valid = true }) : Unauthorized(new { Valid = false });
        }

        // ──────────────────────────────────────────────────
        //  BOUNCER (1.8) — participant validation flow
        // ──────────────────────────────────────────────────

        /// <summary>Get participants in Waiting status (bouncer view)</summary>
        [HttpGet("{eventId}/bouncer/waiting")]
        public async Task<IActionResult> GetWaitingParticipants(int eventId)
        {
            var all = await _eventRepo.GetParticipantsByEventAsync(eventId);
            var waiting = all.Where(p => p.Status == EventParticipantStatus.Waiting
                                      || p.Status == EventParticipantStatus.Validation);
            return Ok(waiting);
        }

        /// <summary>Move participant to Validation status (bouncer starts checking)</summary>
        [HttpPost("{eventId}/bouncer/validate/{userId}")]
        public async Task<IActionResult> ValidateParticipant(int eventId, int userId)
        {
            var ev = await _eventRepo.GetEventByIdAsync(eventId);
            if (ev == null) return NotFound();
            return await _eventRepo.UpdateParticipantStatusAsync(eventId, userId, EventParticipantStatus.Validation)
                ? Ok(new { Status = "Validation" }) : NotFound();
        }

        /// <summary>Admit participant (Validation → Inside)</summary>
        [HttpPost("{eventId}/bouncer/admit/{userId}")]
        public async Task<IActionResult> AdmitParticipant(int eventId, int userId)
        {
            var ev = await _eventRepo.GetEventByIdAsync(eventId);
            if (ev == null) return NotFound();
            return await _eventRepo.UpdateParticipantStatusAsync(eventId, userId, EventParticipantStatus.Inside)
                ? Ok(new { Status = "Inside" }) : NotFound();
        }

        /// <summary>Reject participant (Validation → Outside)</summary>
        [HttpPost("{eventId}/bouncer/reject/{userId}")]
        public async Task<IActionResult> RejectParticipant(int eventId, int userId)
        {
            var ev = await _eventRepo.GetEventByIdAsync(eventId);
            if (ev == null) return NotFound();
            return await _eventRepo.UpdateParticipantStatusAsync(eventId, userId, EventParticipantStatus.Outside)
                ? Ok(new { Status = "Outside" }) : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  PDF EXPORT
        // ════════════════════════════════════════════════════════════

        /// <summary>Export event details (schedule, menu, participants) to PDF</summary>
        [HttpGet("{eventId:int}/export/pdf")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ExportPdf(int eventId)
        {
            try
            {
                var pdf = await _pdfExport.GenerateAsync(eventId);
                return File(pdf, "application/pdf", $"event-{eventId}.pdf");
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Message = $"Event {eventId} not found" });
            }
        }

        // ════════════════════════════════════════════════════════════
        //  DATE SCHEDULING (Doodle-like)
        // ════════════════════════════════════════════════════════════

        /// <summary>Propose a date/time slot for the event</summary>
        [HttpPost("{eventId:int}/dates")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> AddDateProposal(int eventId, [FromBody] AddDateProposalRequest req)
        {
            var proposal = new AudioVerse.Domain.Entities.Events.EventDateProposal
            {
                EventId = eventId,
                ProposedStart = req.ProposedStart,
                ProposedEnd = req.ProposedEnd,
                ProposedByUserId = req.ProposedByUserId,
                Note = req.Note
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddDateProposalCommand(proposal));
            return CreatedAtAction(nameof(GetDateProposals), new { eventId }, new { id });
        }

        /// <summary>Get all proposed dates with votes</summary>
        [HttpGet("{eventId:int}/dates")]
        public async Task<IActionResult> GetDateProposals(int eventId)
        {
            var proposals = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetDateProposalsByEventQuery(eventId));
            return Ok(proposals);
        }

        /// <summary>Delete a proposed date</summary>
        [HttpDelete("dates/{proposalId:int}")]
        public async Task<IActionResult> DeleteDateProposal(int proposalId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteDateProposalCommand(proposalId))
                ? NoContent() : NotFound();
        }

        /// <summary>Vote on a proposed date (upsert — overwrites previous vote)</summary>
        [HttpPost("dates/{proposalId:int}/vote")]
        public async Task<IActionResult> VoteOnDate(int proposalId, [FromBody] VoteDateRequest req)
        {
            var vote = new AudioVerse.Domain.Entities.Events.EventDateVote
            {
                ProposalId = proposalId,
                UserId = req.UserId,
                Status = req.Status,
                Comment = req.Comment
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.UpsertDateVoteCommand(vote));
            return Ok(new { id });
        }

        /// <summary>Remove your vote from a proposed date</summary>
        [HttpDelete("dates/{proposalId:int}/vote/{userId:int}")]
        public async Task<IActionResult> DeleteDateVote(int proposalId, int userId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteDateVoteCommand(proposalId, userId))
                ? NoContent() : NotFound();
        }

        /// <summary>Get ranked dates — best options first (least conflicts, highest availability score)</summary>
        [HttpGet("{eventId:int}/dates/best")]
        public async Task<IActionResult> GetBestDates(int eventId)
        {
            var ranking = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetBestDatesQuery(eventId));
            return Ok(ranking);
        }

        // ════════════════════════════════════════════════════════════
        //  GAME PICKS — voting on what to play
        // ════════════════════════════════════════════════════════════

        /// <summary>Add a game to the event's pick list (ad-hoc)</summary>
        [HttpPost("{eventId:int}/game-picks")]
        public async Task<IActionResult> AddGamePick(int eventId, [FromBody] AddGamePickRequest req)
        {
            var pick = new EventSessionGamePick
            {
                EventId = eventId,
                BoardGameId = req.BoardGameId,
                VideoGameId = req.VideoGameId,
                GameName = req.GameName
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddGamePickCommand(pick));
            return CreatedAtAction(nameof(GetGamePicks), new { eventId }, new { id });
        }

        /// <summary>Import all games from a collection into the event's pick list</summary>
        [HttpPost("{eventId:int}/game-picks/import")]
        public async Task<IActionResult> ImportGamePicks(int eventId, [FromQuery] int collectionId, [FromQuery] bool boardGames = true)
        {
            var count = await _mediator.Send(new AudioVerse.Application.Commands.Events.ImportGamePicksFromCollectionCommand(eventId, collectionId, boardGames));
            return Ok(new { imported = count });
        }

        /// <summary>Get all game picks with votes (sorted by popularity)</summary>
        [HttpGet("{eventId:int}/game-picks")]
        public async Task<IActionResult> GetGamePicks(int eventId)
        {
            var picks = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetGamePicksByEventQuery(eventId));
            return Ok(picks);
        }

        /// <summary>Get ranked game picks — best first, optionally limited</summary>
        [HttpGet("{eventId:int}/game-picks/ranked")]
        public async Task<IActionResult> GetGamePicksRanked(int eventId, [FromQuery] int? limit)
        {
            var ranking = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetGamePicksRankedQuery(eventId, limit));
            return Ok(ranking);
        }

        /// <summary>Delete a game pick</summary>
        [HttpDelete("game-picks/{pickId:int}")]
        public async Task<IActionResult> DeleteGamePick(int pickId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteGamePickCommand(pickId))
                ? NoContent() : NotFound();
        }

        /// <summary>Vote for a game (upsert)</summary>
        [HttpPost("game-picks/{pickId:int}/vote")]
        public async Task<IActionResult> VoteGame(int pickId, [FromBody] VoteGameRequest req)
        {
            var vote = new EventSessionGameVote { PickId = pickId, UserId = req.UserId, Priority = req.Priority };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.UpsertGameVoteCommand(vote));
            return Ok(new { id });
        }

        /// <summary>Remove your game vote</summary>
        [HttpDelete("game-picks/{pickId:int}/vote/{userId:int}")]
        public async Task<IActionResult> DeleteGameVote(int pickId, int userId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteGameVoteCommand(pickId, userId))
                ? NoContent() : NotFound();
        }

        // ════════════════════════════════════════════════════════════
        //  SONG PICKS — signup for karaoke songs
        // ════════════════════════════════════════════════════════════

        /// <summary>Add a song to the session's pick list (ad-hoc)</summary>
        [HttpPost("{eventId:int}/sessions/{sessionId:int}/song-picks")]
        public async Task<IActionResult> AddSongPick(int eventId, int sessionId, [FromBody] AddSongPickRequest req)
        {
            var pick = new EventSessionSongPick
            {
                EventId = eventId,
                SessionId = sessionId,
                SongId = req.SongId,
                SongTitle = req.SongTitle
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddSongPickCommand(pick));
            return CreatedAtAction(nameof(GetSongPicks), new { eventId, sessionId }, new { id });
        }

        /// <summary>Import all songs from a playlist into the session's pick list</summary>
        [HttpPost("{eventId:int}/sessions/{sessionId:int}/song-picks/import")]
        public async Task<IActionResult> ImportSongPicks(int eventId, int sessionId, [FromQuery] int playlistId)
        {
            var count = await _mediator.Send(new AudioVerse.Application.Commands.Events.ImportSongPicksFromPlaylistCommand(eventId, sessionId, playlistId));
            return Ok(new { imported = count });
        }

        /// <summary>Get all song picks with signups (sorted by popularity)</summary>
        [HttpGet("{eventId:int}/sessions/{sessionId:int}/song-picks")]
        public async Task<IActionResult> GetSongPicks(int eventId, int sessionId)
        {
            var picks = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetSongPicksBySessionQuery(eventId, sessionId));
            return Ok(picks);
        }

        /// <summary>Get ranked song picks — most signups first. maxRounds marks which songs "make the cut".</summary>
        [HttpGet("{eventId:int}/sessions/{sessionId:int}/song-picks/ranked")]
        public async Task<IActionResult> GetSongPicksRanked(int eventId, int sessionId, [FromQuery] int? maxRounds)
        {
            var ranking = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetSongPicksRankedQuery(eventId, sessionId, maxRounds));
            return Ok(ranking);
        }

        /// <summary>Delete a song pick</summary>
        [HttpDelete("song-picks/{pickId:int}")]
        public async Task<IActionResult> DeleteSongPick(int pickId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteSongPickCommand(pickId))
                ? NoContent() : NotFound();
        }

        /// <summary>Sign up to perform a song (upsert)</summary>
        [HttpPost("song-picks/{pickId:int}/signup")]
        public async Task<IActionResult> SignupSong(int pickId, [FromBody] SignupSongRequest req)
        {
            var signup = new EventSessionSongSignup { PickId = pickId, UserId = req.UserId, PreferredSlot = req.PreferredSlot };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.UpsertSongSignupCommand(signup));
            return Ok(new { id });
        }

        /// <summary>Remove your song signup</summary>
        [HttpDelete("song-picks/{pickId:int}/signup/{userId:int}")]
        public async Task<IActionResult> DeleteSongSignup(int pickId, int userId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteSongSignupCommand(pickId, userId))
                ? NoContent() : NotFound();
        }

        // ── Recurring events ──

        /// <summary>Generate the next occurrence of a recurring event (copies settings, optionally carries over un-picked proposals).</summary>
        [HttpPost("{eventId:int}/next-occurrence")]
        public async Task<IActionResult> GenerateNextOccurrence(int eventId)
        {
            var newId = await _mediator.Send(new AudioVerse.Application.Commands.Events.GenerateNextOccurrenceCommand(eventId));
            return newId > 0 ? Ok(new { Id = newId }) : BadRequest(new { error = "Event not found or not recurring." });
        }

        /// <summary>Cancel an event occurrence (or a single event). Optionally provide a reason.</summary>
        [HttpPost("{eventId:int}/cancel")]
        public async Task<IActionResult> CancelOccurrence(int eventId, [FromQuery] string? reason = null)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.CancelEventOccurrenceCommand(eventId, reason))
                ? Ok() : NotFound();
        }

        /// <summary>Reschedule an event occurrence to a new date/time.</summary>
        [HttpPost("{eventId:int}/reschedule")]
        public async Task<IActionResult> RescheduleOccurrence(int eventId, [FromQuery] DateTime newStartTime, [FromQuery] DateTime? newEndTime = null)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.RescheduleEventOccurrenceCommand(eventId, newStartTime, newEndTime))
                ? Ok() : NotFound();
        }

        /// <summary>Cancel participation in an event (withdraw RSVP).</summary>
        [HttpPost("{eventId:int}/cancel-participation")]
        public async Task<IActionResult> CancelParticipation(int eventId, [FromQuery] int userId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.CancelParticipationCommand(eventId, userId))
                ? Ok() : NotFound();
        }

        /// <summary>Soft-delete an event (marks as deleted but keeps data).</summary>
        [HttpDelete("{eventId:int}/soft")]
        public async Task<IActionResult> SoftDelete(int eventId)
        {
            var userId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.SoftDeleteEventCommand(eventId, userId))
                ? NoContent() : NotFound();
        }

        /// <summary>Restore a soft-deleted event (admin only).</summary>
        [HttpPost("{eventId:int}/restore")]
        public async Task<IActionResult> Restore(int eventId)
        {
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.RestoreEventCommand(eventId))
                ? Ok() : NotFound();
        }
    }
}

