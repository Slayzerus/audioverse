using Microsoft.AspNetCore.Mvc;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Proxy strumienia audio zewnętrznych stacji radiowych.
    /// Pozwala frontendowi uniknąć CORS i podłączyć stream do Web Audio API (FFT/NoteRiver).
    /// </summary>
    [Route("api/radio-stream")]
    [ApiController]
    public class RadioStreamController(
        IRadioRepository radio,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<RadioStreamController> logger) : ControllerBase
    {
        /// <summary>
        /// Proxy audio stream for a given external station.
        /// If no stationId is provided, streams the default station (Classic FM).
        /// </summary>
        /// <param name="stationId">Optional external radio station ID.</param>
        [HttpGet]
        public async Task StreamProxy([FromQuery] int? stationId = null)
        {
            var streamUrl = await ResolveStreamUrlAsync(stationId);
            if (string.IsNullOrEmpty(streamUrl))
            {
                Response.StatusCode = 404;
                await Response.WriteAsync("Station not found");
                return;
            }

            var client = httpClientFactory.CreateClient("RadioStream");
            HttpResponseMessage upstream;
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, streamUrl);
                request.Headers.Add("Accept", "*/*");
                upstream = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, HttpContext.RequestAborted);
                upstream.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to connect to upstream radio stream: {Url}", streamUrl);
                Response.StatusCode = 502;
                await Response.WriteAsync("Upstream stream unavailable");
                return;
            }

            Response.StatusCode = 200;
            Response.ContentType = upstream.Content.Headers.ContentType?.ToString() ?? "audio/mpeg";
            Response.Headers["Cache-Control"] = "no-cache, no-store";
            Response.Headers["Access-Control-Allow-Origin"] = "*";

            try
            {
                await using var sourceStream = await upstream.Content.ReadAsStreamAsync(HttpContext.RequestAborted);
                await sourceStream.CopyToAsync(Response.Body, HttpContext.RequestAborted);
            }
            catch (OperationCanceledException)
            {
                // Client disconnected — normal for streaming
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Radio stream ended");
            }
            finally
            {
                upstream.Dispose();
            }
        }

        /// <summary>
        /// Get the default station info (used by NoteRiver on first load).
        /// </summary>
        [HttpGet("default")]
        public async Task<IActionResult> GetDefaultStation()
        {
            var defaultUrl = configuration["RadioStream:DefaultStreamUrl"];
            var defaultName = configuration["RadioStream:DefaultStationName"] ?? "Classic FM";

            int? stationId = null;
            if (!string.IsNullOrEmpty(defaultUrl))
            {
                var station = await radio.FindExternalStationByStreamUrlAsync(defaultUrl);
                stationId = station?.Id;
            }

            return Ok(new
            {
                stationId,
                name = defaultName,
                streamUrl = "/api/radio-stream" + (stationId.HasValue ? $"?stationId={stationId}" : ""),
            });
        }

        /// <summary>
        /// List external stations available for streaming (active only).
        /// </summary>
        [HttpGet("stations")]
        public async Task<IActionResult> GetStreamableStations(
            [FromQuery] string? genre = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            pageSize = Math.Clamp(pageSize, 1, 200);
            var (stations, total) = await radio.GetExternalStationsPagedAsync(null, null, genre, page, pageSize);
            var items = stations
                .Where(s => s.IsActive)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.CountryCode,
                    s.Genre,
                    s.BitrateKbps,
                    s.LogoUrl,
                    proxyUrl = $"/api/radio-stream?stationId={s.Id}",
                });
            return Ok(new { items, total, page, pageSize });
        }

        private async Task<string?> ResolveStreamUrlAsync(int? stationId)
        {
            if (stationId.HasValue)
            {
                var station = await radio.GetExternalStationByIdAsync(stationId.Value);
                return station?.IsActive == true ? station.StreamUrl : null;
            }

            var defaultUrl = configuration["RadioStream:DefaultStreamUrl"];
            if (!string.IsNullOrEmpty(defaultUrl))
                return defaultUrl;

            return "https://media-ice.musicradio.com/ClassicFMMP3";
        }
    }
}
