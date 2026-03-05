using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Repositories;
using AudioVerse.API.Models.Admin;
using AudioVerse.Application.Services;
using System.Text.Json;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [Route("api/admin/system-configuration")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SystemConfigurationController : ControllerBase
    {
        private readonly ISystemConfigRepository _repo;
        private readonly ICurrentUserService _currentUser;

        public SystemConfigurationController(ISystemConfigRepository repo, ICurrentUserService currentUser)
        {
            _repo = repo;
            _currentUser = currentUser;
        }

        /// <summary>
        /// Pobierz aktywną konfigurację systemową.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetActive()
        {
            var cfg = await _repo.GetActiveConfigAsync();
            if (cfg == null) return NotFound();

            var dto = new SystemConfigurationDto
            {
                Id = cfg.Id,
                SessionTimeoutMinutes = cfg.SessionTimeoutMinutes,
                CaptchaOption = (int)cfg.CaptchaOption,
                MaxMicrophonePlayers = cfg.MaxMicrophonePlayers,
                GlobalMaxListenersPerStation = cfg.GlobalMaxListenersPerStation,
                GlobalMaxTotalListeners = cfg.GlobalMaxTotalListeners,
                Active = cfg.Active,
                ModifiedAt = cfg.ModifiedAt,
                ModifiedByUserId = cfg.ModifiedByUserId,
                ModifiedByUsername = cfg.ModifiedByUsername,
                FeatureVisibilityOverrides = (cfg.FeatureVisibilityOverrides ?? []).Select(o => new FeatureVisibilityOverrideDto
                {
                    FeatureId = o.FeatureId,
                    Hidden = o.Hidden,
                    VisibleToRoles = o.VisibleToRoles
                }).ToList()
            };

            return Ok(dto);
        }

        /// <summary>
        /// Utwórz nową wersję konfiguracji systemowej (wersjonowanie — stara konfiguracja zostaje w historii).
        /// </summary>
        /// <param name="req">Parametry konfiguracji: timeout sesji, captcha, limity słuchaczy itp.</param>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SystemConfigurationRequest req)
        {
            // basic validation
            if (req.SessionTimeoutMinutes <= 0) return BadRequest("SessionTimeoutMinutes must be > 0");
            if (req.MaxMicrophonePlayers < 0) return BadRequest("MaxMicrophonePlayers must be >= 0");
            if (req.GlobalMaxListenersPerStation.HasValue && req.GlobalMaxListenersPerStation.Value <= 0) return BadRequest("GlobalMaxListenersPerStation must be > 0");
            if (req.GlobalMaxTotalListeners.HasValue && req.GlobalMaxTotalListeners.Value <= 0) return BadRequest("GlobalMaxTotalListeners must be > 0");

            // check against existing station-specific MaxListeners
            if (req.GlobalMaxListenersPerStation.HasValue)
            {
                var violatingIds = await _repo.GetStationsExceedingListenerLimitAsync(req.GlobalMaxListenersPerStation.Value);
                if (violatingIds.Any())
                {
                    var ids = string.Join(',', violatingIds);
                    return BadRequest($"GlobalMaxListenersPerStation is too low. Stations exist with MaxListeners higher than this value. StationIds: {ids}");
                }
            }

            // check total active listeners against new global total limit
            if (req.GlobalMaxTotalListeners.HasValue)
            {
                var activeTotal = await _repo.GetActiveListenerCountAsync();
                if (req.GlobalMaxTotalListeners.Value < activeTotal)
                {
                    return BadRequest($"GlobalMaxTotalListeners is too low. Currently active listeners: {activeTotal}");
                }
            }

            var old = await _repo.GetActiveConfigAsync();

            var newCfg = new AudioVerse.Domain.Entities.Admin.SystemConfiguration
            {
                SessionTimeoutMinutes = req.SessionTimeoutMinutes,
                CaptchaOption = (AudioVerse.Domain.Enums.CaptchaOption)req.CaptchaOption,
                MaxMicrophonePlayers = req.MaxMicrophonePlayers,
                GlobalMaxListenersPerStation = req.GlobalMaxListenersPerStation,
                GlobalMaxTotalListeners = req.GlobalMaxTotalListeners,
                Active = req.Active,
                ModifiedAt = DateTime.UtcNow,
                ModifiedByUserId = _currentUser.UserId,
                ModifiedByUsername = User?.Identity?.Name
            };

            var id = await _repo.CreateConfigAsync(newCfg);

            // Audit
            var audit = new AudioVerse.Domain.Entities.Admin.AuditLog
            {
                UserId = _currentUser.UserId,
                Username = User?.Identity?.Name ?? string.Empty,
                Action = "UpdateSystemConfiguration",
                Description = "Updated system configuration via API",
                DetailsJson = JsonSerializer.Serialize(new { oldConfig = old, newConfig = newCfg }),
                Success = true,
                Timestamp = DateTime.UtcNow,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString()
            };

            await _repo.AddAuditLogAsync(audit);

            return CreatedAtAction(nameof(GetActive), new { id = id }, new SystemConfigurationDto
            {
                Id = id,
                SessionTimeoutMinutes = newCfg.SessionTimeoutMinutes,
                CaptchaOption = (int)newCfg.CaptchaOption,
                MaxMicrophonePlayers = newCfg.MaxMicrophonePlayers,
                GlobalMaxListenersPerStation = newCfg.GlobalMaxListenersPerStation,
                GlobalMaxTotalListeners = newCfg.GlobalMaxTotalListeners,
                Active = newCfg.Active,
                ModifiedAt = newCfg.ModifiedAt,
                ModifiedByUserId = newCfg.ModifiedByUserId,
                ModifiedByUsername = newCfg.ModifiedByUsername
            });
        }

        /// <summary>
        /// Aktualizuj konfigurację systemową (tworzy nową wersję — alias dla Create).
        /// </summary>
        /// <param name="req">Parametry konfiguracji.</param>
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] SystemConfigurationRequest req)
        {
            // reuse create logic (versioning by repository)
            return await Create(req);
        }

        // ──────────────────────────────────────────────────
        //  FEATURE VISIBILITY OVERRIDES
        // ──────────────────────────────────────────────────

        /// <summary>Pobierz listę nadpisań widoczności feature'ów (aktywna konfiguracja).</summary>
        [HttpGet("features")]
        public async Task<IActionResult> GetFeatureOverrides()
        {
            var overrides = await _repo.GetFeatureOverridesAsync();
            var dtos = overrides.Select(o => new FeatureVisibilityOverrideDto
            {
                FeatureId = o.FeatureId,
                Hidden = o.Hidden,
                VisibleToRoles = o.VisibleToRoles
            });
            return Ok(dtos);
        }

        /// <summary>Zbiorczy AddOrUpdate — upsert listy feature'ów (zastępuje istniejące overridy).</summary>
        [HttpPut("features")]
        public async Task<IActionResult> UpsertFeatureOverrides([FromBody] List<FeatureVisibilityOverrideDto> dtos)
        {
            if (dtos == null) return BadRequest();

            var duplicates = dtos.GroupBy(d => d.FeatureId).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
            if (duplicates.Count > 0)
                return BadRequest(new { Message = $"Duplicate featureIds: {string.Join(", ", duplicates)}" });

            var entities = dtos.Select(d => new AudioVerse.Domain.Entities.Admin.FeatureVisibilityOverride
            {
                FeatureId = d.FeatureId,
                Hidden = d.Hidden,
                VisibleToRoles = d.VisibleToRoles
            }).ToList();

            var count = await _repo.UpsertFeatureOverridesAsync(entities);
            return Ok(new { Updated = count });
        }
    }
}
