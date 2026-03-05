using AudioVerse.Application.Services.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AudioVerse.API.Areas.Utils;

/// <summary>
/// AI text-to-motion generation — MotionGPT, MDM, MoMask engines.
/// Generate 3D motion sequences from text prompts. Supports parallel comparison of all engines.
/// </summary>
[ApiController]
[Route("api/ai/motion")]
[Authorize]
[Produces("application/json")]
[Tags("AI - Motion")]
public class AiMotionController : ControllerBase
{
    /// <summary>
    /// Generate motion from text using a specific engine.
    /// </summary>
    /// <param name="prompt">Text description of the motion (e.g. "a person dancing salsa")</param>
    /// <param name="engine">Engine: motiongpt, mdm, momask (default: motiongpt)</param>
    /// <param name="durationSec">Motion duration in seconds (default: 4.0, max: 10.0)</param>
    /// <param name="fps">Frames per second (default: 20)</param>
    [HttpPost("generate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Generate(
        [FromQuery] string prompt,
        [FromQuery] string engine = "motiongpt",
        [FromQuery] double durationSec = 4.0,
        [FromQuery] double fps = 20.0)
    {
        var svc = HttpContext.RequestServices.GetService<IAiMotionService>();
        if (svc == null) return BadRequest(new { Message = "AI Motion service not configured" });

        if (string.IsNullOrWhiteSpace(prompt))
            return BadRequest(new { Message = "Prompt is required" });

        durationSec = Math.Clamp(durationSec, 0.5, 10.0);

        var result = await svc.GenerateAsync(prompt, engine, durationSec, fps);
        if (result == null)
            return BadRequest(new { Message = $"Unknown engine: {engine}. Use: motiongpt, mdm, momask" });

        return result.Error != null
            ? StatusCode(502, result)
            : Ok(result);
    }

    /// <summary>
    /// Generate motion from all 3 engines in parallel for side-by-side comparison.
    /// Returns results from MotionGPT, MDM, and MoMask simultaneously.
    /// </summary>
    /// <param name="prompt">Text description of the motion</param>
    /// <param name="durationSec">Motion duration in seconds (default: 4.0, max: 10.0)</param>
    /// <param name="fps">Frames per second (default: 20)</param>
    [HttpPost("compare")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Compare(
        [FromQuery] string prompt,
        [FromQuery] double durationSec = 4.0,
        [FromQuery] double fps = 20.0)
    {
        var svc = HttpContext.RequestServices.GetService<IAiMotionService>();
        if (svc == null) return BadRequest(new { Message = "AI Motion service not configured" });

        if (string.IsNullOrWhiteSpace(prompt))
            return BadRequest(new { Message = "Prompt is required" });

        durationSec = Math.Clamp(durationSec, 0.5, 10.0);

        var result = await svc.CompareAsync(prompt, durationSec, fps);
        return Ok(result);
    }

    /// <summary>
    /// Generate motion and download as BVH file.
    /// </summary>
    /// <param name="prompt">Text description of the motion</param>
    /// <param name="engine">Engine: motiongpt, mdm, momask (default: motiongpt)</param>
    /// <param name="durationSec">Motion duration in seconds (default: 4.0, max: 10.0)</param>
    [HttpPost("generate/bvh")]
    [Produces("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GenerateBvh(
        [FromQuery] string prompt,
        [FromQuery] string engine = "motiongpt",
        [FromQuery] double durationSec = 4.0)
    {
        var svc = HttpContext.RequestServices.GetService<IAiMotionService>();
        if (svc == null) return BadRequest(new { Message = "AI Motion service not configured" });

        if (string.IsNullOrWhiteSpace(prompt))
            return BadRequest(new { Message = "Prompt is required" });

        durationSec = Math.Clamp(durationSec, 0.5, 10.0);

        var bvh = await svc.GenerateBvhAsync(prompt, engine, durationSec);
        if (bvh == null)
            return StatusCode(502, new { Message = $"Engine '{engine}' unavailable or generation failed" });

        return File(bvh, "application/octet-stream", $"motion_{engine}.bvh");
    }

    /// <summary>
    /// Health check — which motion engines are available and their configured URLs.
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Health()
    {
        var svc = HttpContext.RequestServices.GetService<IAiMotionService>();
        var opts = HttpContext.RequestServices.GetService<IOptions<AiMotionOptions>>()?.Value;

        if (svc == null)
            return Ok(new { configured = false, motiongpt = false, mdm = false, momask = false });

        var status = await svc.HealthCheckAsync();
        return Ok(new
        {
            configured = true,
            endpoints = new
            {
                motiongpt = opts?.MotionGptUrl,
                mdm = opts?.MdmUrl,
                momask = opts?.MoMaskUrl
            },
            available = status
        });
    }
}
