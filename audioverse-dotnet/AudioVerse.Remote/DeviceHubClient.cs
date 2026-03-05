using Microsoft.AspNetCore.SignalR.Client;

namespace AudioVerse.Remote
{
    /// <summary>
    /// Klient SignalR do DeviceHub — sterowanie DMX i strumieniowanie audio w real-time.
    /// </summary>
    public class DeviceHubClient : IAsyncDisposable
    {
        private HubConnection? _connection;
        private readonly RemoteConfig _config;

        public bool IsConnected => _connection?.State == HubConnectionState.Connected;

        public event Action<string>? OnLog;
        public event Action<int, byte>? OnDmxChannelChanged;
        public event Action? OnDmxBlackout;
        public event Action<byte[]>? OnAudioChunk;
        public event Action<string, string, object?>? OnAudioCommand;

        public DeviceHubClient(RemoteConfig config)
        {
            _config = config;
        }

        public async Task ConnectAsync()
        {
            var hubUrl = $"{_config.ApiBaseUrl.TrimEnd('/')}/hubs/devices";

            _connection = new HubConnectionBuilder()
                .WithUrl(hubUrl, options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(_config.AccessToken);
                })
                .WithAutomaticReconnect(new[] { TimeSpan.Zero, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(10) })
                .Build();

            RegisterHandlers();

            _connection.Reconnecting += _ =>
            {
                OnLog?.Invoke("  Ponowne łączenie z hubem...");
                return Task.CompletedTask;
            };

            _connection.Reconnected += _ =>
            {
                OnLog?.Invoke("  Połączono ponownie z hubem.");
                return Task.CompletedTask;
            };

            _connection.Closed += ex =>
            {
                OnLog?.Invoke($"  Hub rozłączony: {ex?.Message ?? "zamknięty"}");
                return Task.CompletedTask;
            };

            await _connection.StartAsync();
            OnLog?.Invoke($"  Połączono z hubem: {hubUrl}");
        }

        private void RegisterHandlers()
        {
            if (_connection == null) return;

            _connection.On<object>("Registered", info =>
                OnLog?.Invoke($"  Urządzenie zarejestrowane: {info}"));

            _connection.On<object>("DeviceOnline", info =>
                OnLog?.Invoke($"  Inne urządzenie online: {info}"));

            _connection.On<object>("DeviceOffline", info =>
                OnLog?.Invoke($"  Urządzenie offline: {info}"));

            _connection.On<string>("Error", msg =>
                OnLog?.Invoke($"  Błąd huba: {msg}"));

            // DMX events
            _connection.On<int, byte>("DmxChannelChanged", (ch, val) =>
                OnDmxChannelChanged?.Invoke(ch, val));

            _connection.On("DmxBlackout", () =>
                OnDmxBlackout?.Invoke());

            _connection.On<object>("DmxPatchApplied", _ =>
                OnLog?.Invoke("  DMX patch zastosowany"));

            _connection.On<object>("DmxState", state =>
                OnLog?.Invoke($"  DMX state: {state}"));

            // Audio events
            _connection.On<object>("AudioChunk", chunk =>
            {
                // W przyszłości: dekodowanie i odtwarzanie
                OnLog?.Invoke("  Otrzymano chunk audio");
            });

            _connection.On<object>("AudioCommand", cmd =>
                OnLog?.Invoke($"  Komenda audio: {cmd}"));

            _connection.On<object>("OnlineDevices", devices =>
                OnLog?.Invoke($"  Urządzenia online: {devices}"));
        }

        // ══════════════════════════════════════════════════════════
        //  REJESTRACJA
        // ══════════════════════════════════════════════════════════

        public async Task RegisterDeviceAsync(string name, string deviceType)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("RegisterDevice", name, deviceType);
        }

        public async Task GetOnlineDevicesAsync()
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("GetOnlineDevices");
        }

        // ══════════════════════════════════════════════════════════
        //  DMX
        // ══════════════════════════════════════════════════════════

        public async Task DmxSetChannelAsync(int channel, byte value)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("DmxSetChannel", channel, value);
        }

        public async Task DmxSetManyAsync(Dictionary<int, int> patch)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("DmxSetMany", patch);
        }

        public async Task DmxBlackoutAsync()
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("DmxBlackout");
        }

        public async Task DmxGetStateAsync()
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("DmxGetState");
        }

        // ══════════════════════════════════════════════════════════
        //  AUDIO
        // ══════════════════════════════════════════════════════════

        public async Task AudioSendChunkAsync(string targetConnectionId, byte[] data, string format = "pcm", int sampleRate = 44100)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("AudioSendChunk", targetConnectionId, data, format, sampleRate);
        }

        public async Task AudioBroadcastAsync(byte[] data, string format = "pcm", int sampleRate = 44100)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("AudioBroadcast", data, format, sampleRate);
        }

        public async Task AudioCommandAsync(string targetConnectionId, string command, object? payload = null)
        {
            if (_connection == null) return;
            await _connection.InvokeAsync("AudioCommand", targetConnectionId, command, payload);
        }

        public async ValueTask DisposeAsync()
        {
            if (_connection != null)
                await _connection.DisposeAsync();
        }
    }
}
