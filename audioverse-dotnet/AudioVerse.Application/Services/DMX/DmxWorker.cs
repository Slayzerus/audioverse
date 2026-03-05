using System.Diagnostics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.DMX
{
    public sealed class DmxWorker : BackgroundService
    {
        private readonly ILogger<DmxWorker> _log;
        private readonly IDmxPort _port;
        private readonly DmxState _state;

        public DmxWorker(ILogger<DmxWorker> log, IDmxPort port, DmxState state)
        {
            _log = log;
            _port = port;
            _state = state;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                if (!_port.IsOpen) _port.Open();
                _port.Configure((uint)_state.Fps, _state.StartCode);
            }
            catch (DllNotFoundException ex)
            {
                _log.LogWarning("DMX disabled — native driver not available: {Lib}. Service will not run.", ex.Message);
                return;
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "DMX open/config failed");
            }

            var frame = new byte[513];
            var sw = new Stopwatch();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _state.SwapFront();
                    _state.CopyFrameTo(frame);

                    if (_port.IsOpen)
                    {
                        _port.Configure((uint)_state.Fps, _state.StartCode);
                        _port.SendFrame(frame);
                    }
                }
                catch (Exception ex)
                {
                    _log.LogWarning(ex, "DMX send failed; retrying");
                    try { _port.Close(); } catch (Exception ex2) when (ex2 is IOException or UnauthorizedAccessException or TimeoutException or InvalidOperationException) { }
                    try { _port.Open(); } catch (Exception ex3) when (ex3 is IOException or UnauthorizedAccessException or TimeoutException or InvalidOperationException) { }
                }

                // Utrzymaj zadane FPS (10..44)
                var targetMs = (int)Math.Round(1000.0 / Math.Clamp(_state.Fps, 10u, 44u));
                sw.Restart();
                // Zrobilismy juz wysylke — po prostu spimy do pelnego okresu
                var slept = 0;
                while (slept < targetMs && !stoppingToken.IsCancellationRequested)
                {
                    var step = Math.Min(2, targetMs - slept);
                    await Task.Delay(step, stoppingToken);
                    slept += step;
                }
                sw.Stop();
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            try { _port?.Close(); } catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or TimeoutException or InvalidOperationException) { }
            await base.StopAsync(cancellationToken);
        }
    }
}
