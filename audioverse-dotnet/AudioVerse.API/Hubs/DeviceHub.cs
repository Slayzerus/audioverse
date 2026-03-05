using AudioVerse.Application.Services.DMX;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace AudioVerse.API.Hubs
{
    /// <summary>
    /// Real-time hub do zdalnego sterowania urządzeniami (DMX, audio).
    /// Klient rejestruje się przez HTTP (auth + device), potem łączy się tu po SignalR.
    /// </summary>
    [Authorize]
    public class DeviceHub : Hub
    {
        private readonly DmxState _dmxState;
        private readonly ILogger<DeviceHub> _logger;

        private static readonly ConcurrentDictionary<string, ConnectedDevice> _devices = new();

        public DeviceHub(DmxState dmxState, ILogger<DeviceHub> logger)
        {
            _dmxState = dmxState;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            _logger.LogInformation("DeviceHub: user {UserId} connected ({ConnId})", userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_devices.TryRemove(Context.ConnectionId, out var device))
            {
                _logger.LogInformation("DeviceHub: device '{Name}' disconnected", device.Name);
                await Clients.Group($"user:{device.UserId}").SendAsync("DeviceOffline", new
                {
                    device.ConnectionId,
                    device.Name,
                    device.DeviceType
                });
            }
            await base.OnDisconnectedAsync(exception);
        }

        // ══════════════════════════════════════════════════════════
        //  REJESTRACJA URZĄDZENIA
        // ══════════════════════════════════════════════════════════

        /// <summary>
        /// Rejestruje połączenie jako urządzenie danego typu.
        /// Klient wywołuje to zaraz po połączeniu.
        /// </summary>
        public async Task RegisterDevice(string name, string deviceType)
        {
            var userId = GetUserId();
            if (userId == null)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized");
                return;
            }

            var device = new ConnectedDevice
            {
                ConnectionId = Context.ConnectionId,
                UserId = userId.Value,
                Name = name,
                DeviceType = deviceType,
                ConnectedAt = DateTime.UtcNow
            };

            _devices[Context.ConnectionId] = device;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            await Groups.AddToGroupAsync(Context.ConnectionId, $"device:{deviceType}");

            _logger.LogInformation("DeviceHub: registered '{Name}' ({Type}) for user {UserId}", name, deviceType, userId);

            await Clients.Caller.SendAsync("Registered", new
            {
                device.Name,
                device.DeviceType,
                device.ConnectedAt
            });

            // Poinformuj inne urządzenia usera
            await Clients.OthersInGroup($"user:{userId}").SendAsync("DeviceOnline", new
            {
                device.ConnectionId,
                device.Name,
                device.DeviceType
            });
        }

        /// <summary>Lista aktywnych urządzeń bieżącego użytkownika.</summary>
        public async Task GetOnlineDevices()
        {
            var userId = GetUserId();
            if (userId == null) return;

            var devices = _devices.Values
                .Where(d => d.UserId == userId.Value)
                .Select(d => new { d.ConnectionId, d.Name, d.DeviceType, d.ConnectedAt })
                .ToList();

            await Clients.Caller.SendAsync("OnlineDevices", devices);
        }

        // ══════════════════════════════════════════════════════════
        //  DMX — STEROWANIE OŚWIETLENIEM
        // ══════════════════════════════════════════════════════════

        /// <summary>Ustaw wartość kanału DMX (1-512, 0-255).</summary>
        public async Task DmxSetChannel(int channel, byte value)
        {
            _dmxState.SetChannel(channel, value);
            await Clients.Group("device:dmx").SendAsync("DmxChannelChanged", channel, value);
        }

        /// <summary>Ustaw wiele kanałów DMX jednocześnie.</summary>
        public async Task DmxSetMany(Dictionary<int, int> patch)
        {
            _dmxState.SetMany(patch);
            await Clients.Group("device:dmx").SendAsync("DmxPatchApplied", patch);
        }

        /// <summary>Blackout — wszystkie kanały na 0.</summary>
        public async Task DmxBlackout()
        {
            _dmxState.Blackout();
            await Clients.Group("device:dmx").SendAsync("DmxBlackout");
        }

        /// <summary>Pobierz aktualny stan DMX universe.</summary>
        public async Task DmxGetState()
        {
            var snapshot = _dmxState.Snapshot();
            await Clients.Caller.SendAsync("DmxState", new
            {
                Fps = (uint)_dmxState.Fps,
                StartCode = _dmxState.StartCode,
                Channels = snapshot
            });
        }

        // ══════════════════════════════════════════════════════════
        //  AUDIO — STRUMIENIOWANIE DŹWIĘKU
        // ══════════════════════════════════════════════════════════

        /// <summary>
        /// Wyślij chunk audio do konkretnego urządzenia lub grupy.
        /// Format: PCM/Opus, klient uzgadnia format przy rejestracji.
        /// </summary>
        public async Task AudioSendChunk(string targetConnectionId, byte[] audioData, string format, int sampleRate)
        {
            await Clients.Client(targetConnectionId).SendAsync("AudioChunk", new
            {
                From = Context.ConnectionId,
                Data = audioData,
                Format = format,
                SampleRate = sampleRate,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });
        }

        /// <summary>Broadcastuj audio do wszystkich urządzeń audio użytkownika.</summary>
        public async Task AudioBroadcast(byte[] audioData, string format, int sampleRate)
        {
            var userId = GetUserId();
            if (userId == null) return;

            var audioDevices = _devices.Values
                .Where(d => d.UserId == userId.Value && d.DeviceType == "audio" && d.ConnectionId != Context.ConnectionId)
                .Select(d => d.ConnectionId)
                .ToList();

            if (audioDevices.Count > 0)
            {
                await Clients.Clients(audioDevices).SendAsync("AudioChunk", new
                {
                    From = Context.ConnectionId,
                    Data = audioData,
                    Format = format,
                    SampleRate = sampleRate,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                });
            }
        }

        /// <summary>Wyślij komendę sterującą do urządzenia audio (play, pause, volume).</summary>
        public async Task AudioCommand(string targetConnectionId, string command, object? payload = null)
        {
            await Clients.Client(targetConnectionId).SendAsync("AudioCommand", new
            {
                From = Context.ConnectionId,
                Command = command,
                Payload = payload,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });
        }

        // ══════════════════════════════════════════════════════════
        //  HELPERS
        // ══════════════════════════════════════════════════════════

        private int? GetUserId()
        {
            var claim = Context.User?.FindFirst("id")?.Value
                     ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
