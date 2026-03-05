using AudioVerse.Application.Services.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Utils;

/// <summary>
/// AI-powered video processing services: pose detection, motion tracking.
/// </summary>
[ApiController]
[Route("api/ai/video")]
[Authorize]
[Produces("application/json")]
[Tags("AI - Video")]
public class AiVideoController : ControllerBase
{
    /// <summary>
    /// Detect human pose in an image.
    /// </summary>
    /// <param name="image">Image file (JPEG, PNG)</param>
    /// <param name="engine">Detection engine: mediapipe, openpose, alphapose, vitpose (default: mediapipe)</param>
    /// <returns>Detected pose keypoints</returns>
    [HttpPost("pose")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectPose(IFormFile image, [FromForm] string engine = "mediapipe")
    {
        var svc = HttpContext.RequestServices.GetService<IAiVideoService>();
        if (svc == null) return BadRequest(new { Message = "AI Video service not configured" });
        using var stream = image.OpenReadStream();
        var result = await svc.DetectPoseAsync(stream, engine);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "AI service unavailable" });
    }

    /// <summary>
    /// Detect human pose across video frames (2D skeleton sequence).
    /// </summary>
    /// <param name="video">Video file (MP4, AVI, MOV)</param>
    /// <param name="engine">Detection engine: mediapipe, openpose, alphapose, vitpose</param>
    [HttpPost("pose/video")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectPoseVideo(IFormFile video, [FromForm] string engine = "mediapipe")
    {
        var svc = HttpContext.RequestServices.GetService<IAiVideoService>();
        if (svc == null) return BadRequest(new { Message = "AI Video service not configured" });
        using var stream = video.OpenReadStream();
        var result = await svc.DetectPoseVideoAsync(stream, engine);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "AI service unavailable" });
    }

    /// <summary>
    /// Detect 3D pose from video using PoseFormer.
    /// </summary>
    /// <param name="video">Video file with human subject</param>
    [HttpPost("pose3d")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> DetectPose3D(IFormFile video)
    {
        var svc = HttpContext.RequestServices.GetService<IAiVideoService>();
        if (svc == null) return BadRequest(new { Message = "AI Video service not configured" });
        using var stream = video.OpenReadStream();
        var result = await svc.DetectPose3DAsync(stream);
        return result != null ? Ok(result) : StatusCode(502, new { Message = "PoseFormer service unavailable" });
    }
}

