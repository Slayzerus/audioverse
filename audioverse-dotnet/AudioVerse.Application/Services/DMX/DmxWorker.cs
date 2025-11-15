using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
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
            // Otwórz port, jeśli nieotwarty
            try
            {
                if (!_port.IsOpen) _port.Open();
                _port.Configure((uint)_state.Fps, _state.StartCode);
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "DMX open/config failed");
                // Próbuj dalej w pętli (np. interfejs niepodłączony)
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
                    try { _port.Close(); } catch { }
                    try { _port.Open(); } catch { }
                }

                // Utrzymaj żądane FPS (10..44)
                var targetMs = (int)Math.Round(1000.0 / Math.Clamp(_state.Fps, 10u, 44u));
                sw.Restart();
                // Zrobiliśmy już wysyłkę — po prostu śpimy do pełnego okresu
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
            try { _port?.Close(); } catch { }
            await base.StopAsync(cancellationToken);
        }
    }
}
