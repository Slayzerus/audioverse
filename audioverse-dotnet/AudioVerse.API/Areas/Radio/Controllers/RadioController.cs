using Microsoft.AspNetCore.Mvc;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.API.Models.Requests.Radio;
using AudioVerse.API.Models.Radio;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Radio stations — core CRUD, broadcast start/stop, schedule, external stations.
    /// </summary>
    [Route("api/radio")]
    [ApiController]
    public class RadioController(IRadioRepository radio, ISystemConfigRepository sysConfig) : ControllerBase
    {

        /// <summary>
        /// Start a broadcast session on a radio station (creates a BroadcastSession).
        /// </summary>
        /// <param name="id">Radio station ID.</param>
        /// <param name="req">Optional: playlist ID to broadcast.</param>
        [HttpPost("{id}/start")]
        public async Task<IActionResult> Start(int id, [FromBody] StartBroadcastRequest req)
        {
            var station = await radio.GetStationByIdAsync(id);
            if (station == null) return NotFound();

            var session = new BroadcastSession
            {
                RadioStationId = id,
                PlaylistId = req?.PlaylistId,
                StartUtc = DateTime.UtcNow,
                IsRunning = true,
                CreatedAt = DateTime.UtcNow
            };

            await radio.AddBroadcastSessionAsync(session);
            return Ok(new { success = true, sessionId = session.Id });
        }

        /// <summary>
        /// Stop the active broadcast session on a radio station (Admin only).
        /// </summary>
        /// <param name="id">Radio station ID.</param>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/stop")]
        public async Task<IActionResult> Stop(int id)
        {
            var session = await radio.GetActiveSessionAsync(id);
            if (session == null) return NotFound();
            session.IsRunning = false;
            session.EndUtc = DateTime.UtcNow;
            await radio.SaveChangesAsync();
            return Ok(new { success = true });
        }

        /// <summary>
        /// Create a new radio station (Admin only). Validates listener limits against system configuration.
        /// </summary>
        /// <param name="req">Station name, slug, description, listener limit and visibility.</param>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateStation([FromBody] RadioStationCreateRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Slug))
                return BadRequest("Name and Slug are required");

            var cfg = await sysConfig.GetActiveConfigAsync();
            if (cfg?.GlobalMaxListenersPerStation.HasValue == true && req.MaxListeners.HasValue && req.MaxListeners.Value > cfg.GlobalMaxListenersPerStation.Value)
                return BadRequest($"MaxListeners cannot exceed global per-station limit of {cfg.GlobalMaxListenersPerStation.Value}");

            var station = new AudioVerse.Domain.Entities.Radio.RadioStation
            {
                Name = req.Name,
                Slug = req.Slug,
                Description = req.Description,
                MaxListeners = req.MaxListeners,
                IsPublic = req.IsPublic
            };

            await radio.AddStationAsync(station);
            return Ok(station);
        }

        /// <summary>
        /// Update an existing radio station (Admin only). Validates listener limits.
        /// </summary>
        /// <param name="id">Radio station ID.</param>
        /// <param name="req">Updated station data.</param>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStation(int id, [FromBody] RadioStationCreateRequest req)
        {
            var station = await radio.GetStationByIdAsync(id);
            if (station == null) return NotFound();

            var cfg = await sysConfig.GetActiveConfigAsync();
            if (cfg?.GlobalMaxListenersPerStation.HasValue == true && req.MaxListeners.HasValue && req.MaxListeners.Value > cfg.GlobalMaxListenersPerStation.Value)
                return BadRequest($"MaxListeners cannot exceed global per-station limit of {cfg.GlobalMaxListenersPerStation.Value}");

            station.Name = req.Name ?? station.Name;
            station.Slug = req.Slug ?? station.Slug;
            station.Description = req.Description ?? station.Description;
            station.MaxListeners = req.MaxListeners;
            station.IsPublic = req.IsPublic;

            await radio.SaveChangesAsync();
            return Ok(station);
        }


        /// <summary>
        /// Get station schedule (public — confirmed slots only).
        /// </summary>
        [HttpGet("{id}/schedule")]
        public async Task<IActionResult> GetSchedule(int id)
        {
            var slots = (await radio.GetScheduleSlotsAsync(id))
                .Where(s => s.IsConfirmed)
                .OrderBy(s => s.DayOfWeek).ThenBy(s => s.SpecificDate).ThenBy(s => s.StartTimeUtc)
                .Select(s => new
                {
                    s.Id, s.Title, s.Description, s.DayOfWeek, s.SpecificDate,
                    startTime = s.StartTimeUtc.ToString(@"hh\:mm"),
                    endTime = s.EndTimeUtc.ToString(@"hh\:mm"),
                    s.DjName, s.DjUserId, s.PlaylistId, s.Color
                });
            return Ok(slots);
        }

        /// <summary>
        /// Get full station schedule — including unconfirmed slots (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/schedule/all")]
        public async Task<IActionResult> GetScheduleAll(int id)
        {
            var slots = await radio.GetScheduleSlotsAsync(id);
            return Ok(slots);
        }

        /// <summary>
        /// Add a schedule slot (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/schedule")]
        public async Task<IActionResult> AddScheduleSlot(int id, [FromBody] ScheduleSlotRequest req)
        {
            var slot = new RadioScheduleSlot
            {
                RadioStationId = id,
                Title = req.Title,
                Description = req.Description,
                DayOfWeek = req.DayOfWeek,
                SpecificDate = req.SpecificDate,
                StartTimeUtc = TimeSpan.Parse(req.StartTime),
                EndTimeUtc = TimeSpan.Parse(req.EndTime),
                PlaylistId = req.PlaylistId,
                InviteId = req.InviteId,
                DjUserId = req.DjUserId,
                DjName = req.DjName,
                IsConfirmed = req.IsConfirmed,
                Color = req.Color
            };
            await radio.AddScheduleSlotAsync(slot);
            return Ok(new { slot.Id });
        }

        /// <summary>
        /// Update a schedule slot (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/schedule/{slotId}")]
        public async Task<IActionResult> UpdateScheduleSlot(int id, int slotId, [FromBody] ScheduleSlotRequest req)
        {
            var slot = await radio.GetScheduleSlotAsync(slotId, id);
            if (slot == null) return NotFound();
            slot.Title = req.Title; slot.Description = req.Description;
            slot.DayOfWeek = req.DayOfWeek; slot.SpecificDate = req.SpecificDate;
            slot.StartTimeUtc = TimeSpan.Parse(req.StartTime); slot.EndTimeUtc = TimeSpan.Parse(req.EndTime);
            slot.PlaylistId = req.PlaylistId; slot.InviteId = req.InviteId;
            slot.DjUserId = req.DjUserId; slot.DjName = req.DjName;
            slot.IsConfirmed = req.IsConfirmed; slot.Color = req.Color;
            await radio.SaveChangesAsync();
            return Ok(slot);
        }

        /// <summary>
        /// Delete a schedule slot (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/schedule/{slotId}")]
        public async Task<IActionResult> DeleteScheduleSlot(int id, int slotId)
        {
            var deleted = await radio.DeleteScheduleSlotAsync(slotId, id);
            if (!deleted) return NotFound();
            return NoContent();
        }


        /// <summary>
        /// Get external online radio stations (public). Filter by country, language, genre.
        /// </summary>
        [HttpGet("external")]
        public async Task<IActionResult> GetExternalStations(
            [FromQuery] string? country = null,
            [FromQuery] string? language = null,
            [FromQuery] string? genre = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            pageSize = Math.Clamp(pageSize, 1, 200);
            var (stations, total) = await radio.GetExternalStationsPagedAsync(country, language, genre, page, pageSize);
            var items = stations.Select(s => new { s.Id, s.Name, s.StreamUrl, s.WebsiteUrl, s.LogoUrl, s.CountryCode, s.CountryName, s.Language, s.Genre, s.BitrateKbps });
            return Ok(new { items, total, page, pageSize });
        }

        /// <summary>
        /// Get available countries of external radio stations.
        /// </summary>
        [HttpGet("external/countries")]
        public async Task<IActionResult> GetExternalCountries()
        {
            var countries = await radio.GetExternalStationCountryStatsAsync();
            return Ok(countries);
        }

        /// <summary>
        /// Add an external radio station (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("external")]
        public async Task<IActionResult> AddExternalStation([FromBody] ExternalRadioStationRequest req)
        {
            var station = new ExternalRadioStation
            {
                Name = req.Name, Slug = req.Slug, StreamUrl = req.StreamUrl,
                WebsiteUrl = req.WebsiteUrl, LogoUrl = req.LogoUrl,
                CountryCode = req.CountryCode?.ToUpper() ?? "", CountryName = req.CountryName,
                Language = req.Language?.ToLower(), Genre = req.Genre, BitrateKbps = req.BitrateKbps
            };
            await radio.AddExternalStationAsync(station);
            return Ok(new { station.Id });
        }

        /// <summary>
        /// Toggle an external station active/inactive (Admin).
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPatch("external/{stationId}/toggle")]
        public async Task<IActionResult> ToggleExternalStation(int stationId)
        {
            var s = await radio.GetExternalStationByIdAsync(stationId);
            if (s == null) return NotFound();
            s.IsActive = !s.IsActive;
            await radio.SaveChangesAsync();
            return Ok(new { s.Id, s.IsActive });
        }
    }
}
