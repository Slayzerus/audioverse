using AudioVerse.Application.Services.SongInformations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

[ApiController]
[Route("api/library/license")]
[Authorize]
[Produces("application/json")]
[Tags("Library - License")]
public class LicenseController : ControllerBase
{
    private readonly ISongLicenseService _licenseService;

    public LicenseController(ISongLicenseService licenseService) => _licenseService = licenseService;

    /// <summary>Look up song license info by title and/or artist.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SongLicenseInfo>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Lookup([FromQuery] string title, [FromQuery] string artist)
    {
        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(artist))
            return Ok(Array.Empty<SongLicenseInfo>());

        var results = await _licenseService.GetLicenseInfoAsync(title ?? "", artist ?? "");
        return Ok(results);
    }
}
