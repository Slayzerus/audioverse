using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Queries.Admin;
using Microsoft.Extensions.Caching.Memory;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    [ApiController]
    [Route("api/skins")]
    [Produces("application/json")]
    [Tags("Skins - Theme Picker")]
    public class SkinThemeController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMemoryCache _cache;

        private const string ActiveSkinsCacheKey = "active_skins";
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

        public SkinThemeController(IMediator mediator, IMemoryCache cache)
        {
            _mediator = mediator;
            _cache = cache;
        }

        /// <summary>
        /// Get all active skin themes available for the theme picker.
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActive()
        {
            var skins = await _cache.GetOrCreateAsync(ActiveSkinsCacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                return await _mediator.Send(new GetActiveSkinThemesQuery());
            });

            return Ok(new { Success = true, Skins = skins });
        }

        /// <summary>
        /// Get a specific skin theme by ID (must be active).
        /// </summary>
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var skin = await _mediator.Send(new GetSkinThemeByIdQuery(id));
            if (skin == null || !skin.IsActive) return NotFound();
            return Ok(skin);
        }
    }
}
