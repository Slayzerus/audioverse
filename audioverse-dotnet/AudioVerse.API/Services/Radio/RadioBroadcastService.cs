using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using AudioVerse.API.Hubs;
using AudioVerse.API.Services.Radio;

namespace AudioVerse.API.Services.Radio
{
    public class RadioBroadcastService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<RadioHub> _hubContext;
        private readonly ILogger<RadioBroadcastService> _logger;

        public RadioBroadcastService(
            IServiceScopeFactory scopeFactory,
            IHubContext<RadioHub> hubContext,
            ILogger<RadioBroadcastService> logger)
        {
            _scopeFactory = scopeFactory;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RadioBroadcastService started");
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
                    var radioService = scope.ServiceProvider.GetRequiredService<IRadioService>();

                    // find running sessions
                    var sessions = await db.BroadcastSessions
                        .Where(s => s.IsRunning)
                        .ToListAsync(cancellationToken: stoppingToken);

                    foreach (var s in sessions)
                    {
                        try
                        {
                            var now = await radioService.GetNowPlayingAsync(s.RadioStationId);
                            if (now != null)
                            {
                                await _hubContext.Clients.Group($"radio:{s.RadioStationId}").SendAsync("NowPlaying", now, cancellationToken: stoppingToken);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to push NowPlaying for station {Station}", s.RadioStationId);
                        }
                    }
                }
                catch (OperationCanceledException) { }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in RadioBroadcastService loop");
                }

                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }

            _logger.LogInformation("RadioBroadcastService stopping");
        }
    }
}
