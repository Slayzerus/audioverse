using AudioVerse.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>
/// Image filters for player photos — preview, apply, and save.
/// </summary>
[ApiController]
[Route("api/user/players/{playerId:int}/photo")]
[Tags("Identity - Player Photo Filters")]
public class PlayerPhotoFilterController : ControllerBase
{
    /// <summary>
    /// List all available image filters grouped by category.
    /// </summary>
    [HttpGet("filters")]
    [AllowAnonymous]
    public IActionResult GetAvailableFilters()
    {
        var grouped = ImageFilterEngine.AvailableFilters
            .GroupBy(f => f.Category)
            .Select(g => new { Category = g.Key, Filters = g.Select(f => new { f.Name, f.DisplayName }) });
        return Ok(grouped);
    }

    /// <summary>
    /// Preview a single filter on the player's current photo. Returns filtered PNG.
    /// </summary>
    /// <param name="playerId">Player ID</param>
    /// <param name="filter">Filter name (e.g. "pixelart", "noir", "cyberpunk")</param>
    /// <param name="size">Output size in pixels (default 256, max 512)</param>
    [HttpGet("filters/{filter}/preview")]
    [AllowAnonymous]
    public async Task<IActionResult> PreviewFilter(int playerId, string filter, [FromQuery] int size = 256)
    {
        size = Math.Clamp(size, 32, 512);
        var photoBytes = await GetPlayerPhotoBytes(playerId);
        if (photoBytes == null) return NotFound(new { Message = "Player has no photo" });

        if (!ImageFilterEngine.AvailableFilters.Any(f => f.Name == filter.ToLowerInvariant()))
            return BadRequest(new { Message = $"Unknown filter: {filter}" });

        var result = ImageFilterEngine.Apply(photoBytes, filter, size);
        return File(result, "image/png");
    }

    /// <summary>
    /// Generate a preview sheet with all filters applied to the player's photo.
    /// Returns a single PNG image with small thumbnails of each filter.
    /// </summary>
    /// <param name="playerId">Player ID</param>
    /// <param name="thumbSize">Thumbnail size (default 64, max 128)</param>
    [HttpGet("filters/preview-sheet")]
    [AllowAnonymous]
    public async Task<IActionResult> PreviewSheet(int playerId, [FromQuery] int thumbSize = 64)
    {
        thumbSize = Math.Clamp(thumbSize, 32, 128);
        var photoBytes = await GetPlayerPhotoBytes(playerId);
        if (photoBytes == null) return NotFound(new { Message = "Player has no photo" });

        var result = ImageFilterEngine.GeneratePreviewSheet(photoBytes, thumbSize);
        return File(result, "image/png");
    }

    /// <summary>
    /// Apply a filter to the player's photo and save as the new photo (replaces original).
    /// </summary>
    /// <param name="playerId">Player ID</param>
    /// <param name="filter">Filter name</param>
    /// <param name="size">Output size (default 256, max 512)</param>
    [HttpPost("filters/{filter}/apply")]
    [Authorize]
    public async Task<IActionResult> ApplyAndSave(int playerId, string filter, [FromQuery] int size = 256)
    {
        size = Math.Clamp(size, 32, 512);
        if (!ImageFilterEngine.AvailableFilters.Any(f => f.Name == filter.ToLowerInvariant()))
            return BadRequest(new { Message = $"Unknown filter: {filter}" });

        var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
        var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();

        var player = await repo.GetPlayerByIdAsync(playerId);
        if (player == null) return NotFound();
        if (string.IsNullOrEmpty(player.PhotoKey)) return BadRequest(new { Message = "Player has no photo to filter" });

        var stream = await fs.DownloadAsync("player-photos", player.PhotoKey);
        if (stream == null) return NotFound(new { Message = "Photo file not found in storage" });

        byte[] original;
        using (var ms = new MemoryStream())
        {
            await stream.CopyToAsync(ms);
            original = ms.ToArray();
        }

        var filtered = ImageFilterEngine.Apply(original, filter, size);

        // Delete old file
        await fs.DeleteAsync("player-photos", player.PhotoKey);

        var key = $"{playerId}/{Guid.NewGuid()}.png";
        using var uploadStream = new MemoryStream(filtered);
        await fs.UploadAsync("player-photos", key, uploadStream, "image/png");

        player.PhotoKey = key;
        await repo.UpdatePlayerAsync(player);

        return Ok(new { Success = true, Filter = filter, Key = key });
    }

    /// <summary>
    /// Upload a new photo, apply a filter, and save — all in one step.
    /// </summary>
    /// <param name="playerId">Player ID</param>
    /// <param name="filter">Filter name</param>
    /// <param name="file">Image file</param>
    /// <param name="size">Output size (default 256, max 512)</param>
    [HttpPost("filters/{filter}/upload")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadWithFilter(int playerId, string filter, IFormFile file, [FromQuery] int size = 256)
    {
        if (file == null || file.Length == 0) return BadRequest(new { Message = "File is required" });
        size = Math.Clamp(size, 32, 512);

        if (!ImageFilterEngine.AvailableFilters.Any(f => f.Name == filter.ToLowerInvariant()))
            return BadRequest(new { Message = $"Unknown filter: {filter}" });

        var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
        var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();

        var player = await repo.GetPlayerByIdAsync(playerId);
        if (player == null) return NotFound();

        // Delete old photo
        if (!string.IsNullOrEmpty(player.PhotoKey))
            await fs.DeleteAsync("player-photos", player.PhotoKey);

        var bytes = new byte[file.Length];
        using (var s = file.OpenReadStream()) await s.ReadExactlyAsync(bytes);

        var filtered = ImageFilterEngine.Apply(bytes, filter, size);

        var key = $"{playerId}/{Guid.NewGuid()}.png";
        await fs.EnsureBucketExistsAsync("player-photos");
        using var ms = new MemoryStream(filtered);
        await fs.UploadAsync("player-photos", key, ms, "image/png");

        player.PhotoKey = key;
        await repo.UpdatePlayerAsync(player);

        return Ok(new { Success = true, Filter = filter, Key = key });
    }

    private async Task<byte[]?> GetPlayerPhotoBytes(int playerId)
    {
        var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
        var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();

        var player = await repo.GetPlayerByIdAsync(playerId);
        if (player == null || string.IsNullOrEmpty(player.PhotoKey)) return null;

        var stream = await fs.DownloadAsync("player-photos", player.PhotoKey);
        if (stream == null) return null;

        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        return ms.ToArray();
    }
}
