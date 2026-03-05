using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using AudioVerse.Domain.Repositories;
using AudioVerse.API.Services.Radio;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Radio station statistics — daily stats, export CSV, now playing, listeners, summary.
    /// </summary>
    [Route("api/radio")]
    [ApiController]
    public class RadioStatsController(IRadioService radioService, IRadioRepository radio) : ControllerBase
    {
        /// <summary>Daily station statistics: joins, leaves, unique listeners, average listen time.</summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/stats/daily")]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> StatsDaily(int id, [FromQuery] int days = 30)
        {
            if (days <= 0 || days > 365) return BadRequest("days must be between 1 and 365");

            var result = new List<object>();
            for (int i = 0; i < days; i++)
            {
                var day = DateTime.UtcNow.Date.AddDays(-i);
                var (joins, leaves, uniqueListeners, avgListen) = await radio.GetDailyStatsAsync(id, day, day.AddDays(1));
                result.Add(new { date = day.ToString("yyyy-MM-dd"), joins, leaves, uniqueListeners, averageListenSeconds = avgListen });
            }

            return Ok(result.OrderBy(r => ((dynamic)r).date));
        }

        /// <summary>Export radio station statistics to a CSV file for a given date range.</summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/stats/export")]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> ExportStatsCsv(int id, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            var tf = to ?? DateTime.UtcNow.Date;
            var ff = from ?? tf.AddDays(-30);
            if (ff > tf) return BadRequest("from must be before to");

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("date,joins,leaves,unique_listeners,average_listen_seconds");

            var cur = ff.Date;
            while (cur <= tf.Date)
            {
                var (joins, leaves, uniqueListeners, avgListen) = await radio.GetDailyStatsAsync(id, cur, cur.AddDays(1));
                sb.AppendLine($"{cur:yyyy-MM-dd},{joins},{leaves},{uniqueListeners},{avgListen:F2}");
                cur = cur.AddDays(1);
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"radio_{id}_stats_{ff:yyyyMMdd}_{tf:yyyyMMdd}.csv");
        }

        /// <summary>Get the currently playing track (NowPlaying) for a radio station.</summary>
        [HttpGet("{id}/now")]
        public async Task<IActionResult> Now(int id)
        {
            var now = await radioService.GetNowPlayingAsync(id);
            if (now == null) return NotFound();
            return Ok(now);
        }

        /// <summary>List active listeners of a radio station (Admin only).</summary>
        [HttpGet("{id}/listeners")]
        [Authorize(Roles = "Admin")]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> ListListeners(int id)
        {
            var lst = (await radio.GetActiveListenersAsync(id))
                .Select(l => new AudioVerse.API.Models.Radio.ListenerDto
                {
                    UserId = l.UserId,
                    ConnectionId = l.ConnectionId,
                    ClientInfo = l.ClientInfo,
                    RemoteIp = l.RemoteIp,
                    ConnectedAtUtc = l.ConnectedAtUtc
                })
                .ToList();

            return Ok(lst);
        }

        /// <summary>Station statistics summary: total joins/leaves, unique listeners, average listen time.</summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/stats/summary")]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> StatsSummary(int id)
        {
            var (totalJoins, totalLeaves, uniqueListeners, avgSeconds) = await radio.GetStatsSummaryAsync(id);
            return Ok(new { totalJoins, totalLeaves, uniqueListeners, averageListenSeconds = avgSeconds });
        }

        /// <summary>Top 10 station listeners by total listen time.</summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/stats/top-listeners")]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> TopListeners(int id)
        {
            var top = (await radio.GetTopListenersAsync(id, 10))
                .Select(x => new { x.UserId, TotalSec = x.TotalSeconds });
            return Ok(top);
        }
    }
}
