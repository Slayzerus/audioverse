using AudioVerse.Remote;

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.Title = "AudioVerse Remote";

Console.WriteLine("╔══════════════════════════════════════════╗");
Console.WriteLine("║       AudioVerse Remote Controller       ║");
Console.WriteLine("║  DMX Lighting · Audio Stream · Devices   ║");
Console.WriteLine("╚══════════════════════════════════════════╝");
Console.WriteLine();

var config = RemoteConfig.Load();
using var api = new ApiClient(config);
await using var hub = new DeviceHubClient(config);

hub.OnLog += msg => Console.WriteLine(msg);
hub.OnDmxChannelChanged += (ch, val) => Console.WriteLine($"  DMX ch{ch} = {val}");
hub.OnDmxBlackout += () => Console.WriteLine("  DMX: BLACKOUT");

// ═══ Setup ═══
if (!config.IsLoggedIn)
    await SetupConnection(config, api);

if (config.IsLoggedIn)
{
    Console.WriteLine();
    Console.Write("Łączenie z hubem real-time... ");
    try
    {
        await hub.ConnectAsync();
        Console.WriteLine("OK");

        // Rejestracja urządzenia w hubie
        var deviceType = config.DeviceName?.Contains("dmx", StringComparison.OrdinalIgnoreCase) == true ? "dmx" : "audio";
        await hub.RegisterDeviceAsync(config.DeviceName ?? Environment.MachineName, deviceType);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"BŁĄD: {ex.Message}");
        Console.WriteLine("  Kontynuuję bez real-time. Sprawdź URL i token.");
    }
}

await MainLoop(config, api, hub);

// ═══════════════════════════════════════════════════════════
//  MENU
// ═══════════════════════════════════════════════════════════

static async Task MainLoop(RemoteConfig config, ApiClient api, DeviceHubClient hub)
{
    while (true)
    {
        Console.WriteLine();
        Console.WriteLine("══════ MENU ══════");
        Console.WriteLine("  1  DMX — ustaw kanał");
        Console.WriteLine("  2  DMX — blackout");
        Console.WriteLine("  3  DMX — pokaż stan");
        Console.WriteLine("  4  DMX — ustaw wiele kanałów");
        Console.WriteLine("  5  Audio — wyślij test chunk");
        Console.WriteLine("  6  Urządzenia online");
        Console.WriteLine("  7  Konfiguracja (zmień URL / login)");
        Console.WriteLine("  8  Informacje o połączeniu");
        Console.WriteLine("  0  Wyjście");
        Console.Write("> ");

        var choice = Console.ReadLine()?.Trim();
        try
        {
            switch (choice)
            {
                case "1": await DmxSetChannel(hub); break;
                case "2": await DmxBlackout(hub); break;
                case "3": await DmxGetState(hub); break;
                case "4": await DmxSetMany(hub); break;
                case "5": await AudioTestChunk(hub); break;
                case "6": await ShowOnlineDevices(hub); break;
                case "7": await SetupConnection(config, api); break;
                case "8": ShowConnectionInfo(config, hub); break;
                case "0": return;
                default: Console.WriteLine("  Nieznana opcja."); break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  Błąd: {ex.Message}");
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════

static async Task SetupConnection(RemoteConfig config, ApiClient api)
{
    Console.WriteLine();
    Console.WriteLine("─── Konfiguracja połączenia ───");

    Console.Write($"  API URL [{config.ApiBaseUrl}]: ");
    var apiUrl = Console.ReadLine()?.Trim();
    if (!string.IsNullOrEmpty(apiUrl))
        config.ApiBaseUrl = apiUrl;

    Console.Write($"  Identity URL [{config.IdentityBaseUrl}]: ");
    var idUrl = Console.ReadLine()?.Trim();
    if (!string.IsNullOrEmpty(idUrl))
        config.IdentityBaseUrl = idUrl;

    Console.Write("  Login (username): ");
    var username = Console.ReadLine()?.Trim() ?? "";

    Console.Write("  Hasło: ");
    var password = ReadPassword();

    if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
    {
        Console.WriteLine("  Pominięto logowanie.");
        config.Save();
        return;
    }

    Console.Write("  Logowanie... ");
    if (await api.LoginAsync(username, password))
    {
        Console.WriteLine("OK ✓");

        // Nazwa urządzenia
        Console.Write($"  Nazwa urządzenia [{Environment.MachineName}]: ");
        var deviceName = Console.ReadLine()?.Trim();
        config.DeviceName = string.IsNullOrEmpty(deviceName) ? Environment.MachineName : deviceName;

        // Rejestracja urządzenia przez HTTP
        Console.Write("  Typ urządzenia (dmx/audio) [dmx]: ");
        var deviceType = Console.ReadLine()?.Trim();
        if (string.IsNullOrEmpty(deviceType)) deviceType = "dmx";

        Console.Write("  Rejestracja urządzenia... ");
        var deviceId = await api.RegisterDeviceAsync(config.DeviceName, deviceType);
        if (deviceId != null)
        {
            config.DeviceId = deviceId;
            Console.WriteLine($"OK (ID: {deviceId})");
        }
        else
        {
            Console.WriteLine("pominięto (urządzenie może już istnieć)");
        }

        config.Save();
    }
    else
    {
        Console.WriteLine("BŁĄD ✗");
    }
}

// ═══════════════════════════════════════════════════════════
//  DMX
// ═══════════════════════════════════════════════════════════

static async Task DmxSetChannel(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }

    Console.Write("  Kanał (1-512): ");
    if (!int.TryParse(Console.ReadLine(), out var ch) || ch < 1 || ch > 512) { Console.WriteLine("  Nieprawidłowy kanał."); return; }

    Console.Write("  Wartość (0-255): ");
    if (!byte.TryParse(Console.ReadLine(), out var val)) { Console.WriteLine("  Nieprawidłowa wartość."); return; }

    await hub.DmxSetChannelAsync(ch, val);
    Console.WriteLine($"  → ch{ch} = {val}");
}

static async Task DmxSetMany(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }

    Console.WriteLine("  Podaj kanały (format: kanał=wartość, np. 1=255 2=128 3=0):");
    Console.Write("  > ");
    var input = Console.ReadLine()?.Trim() ?? "";

    var patch = new Dictionary<int, int>();
    foreach (var part in input.Split(' ', StringSplitOptions.RemoveEmptyEntries))
    {
        var kv = part.Split('=');
        if (kv.Length == 2 && int.TryParse(kv[0], out var ch) && int.TryParse(kv[1], out var val))
            patch[ch] = val;
    }

    if (patch.Count == 0) { Console.WriteLine("  Brak prawidłowych par."); return; }

    await hub.DmxSetManyAsync(patch);
    Console.WriteLine($"  → Ustawiono {patch.Count} kanałów");
}

static async Task DmxBlackout(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }
    await hub.DmxBlackoutAsync();
    Console.WriteLine("  → Blackout wysłany");
}

static async Task DmxGetState(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }
    await hub.DmxGetStateAsync();
    // Odpowiedź przyjdzie asynchronicznie przez OnLog
}

// ═══════════════════════════════════════════════════════════
//  AUDIO
// ═══════════════════════════════════════════════════════════

static async Task AudioTestChunk(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }

    // Generuj prostą falę sinusoidalną jako test (440Hz, 0.1s)
    const int sampleRate = 44100;
    const int duration = 4410; // 0.1s
    var buffer = new byte[duration * 2]; // 16-bit PCM
    for (int i = 0; i < duration; i++)
    {
        var sample = (short)(Math.Sin(2 * Math.PI * 440 * i / sampleRate) * 32767);
        buffer[i * 2] = (byte)(sample & 0xFF);
        buffer[i * 2 + 1] = (byte)((sample >> 8) & 0xFF);
    }

    await hub.AudioBroadcastAsync(buffer, "pcm", sampleRate);
    Console.WriteLine("  → Wysłano test chunk (440Hz, 100ms) do urządzeń audio");
}

// ═══════════════════════════════════════════════════════════
//  INNE
// ═══════════════════════════════════════════════════════════

static async Task ShowOnlineDevices(DeviceHubClient hub)
{
    if (!hub.IsConnected) { Console.WriteLine("  Nie połączono z hubem."); return; }
    await hub.GetOnlineDevicesAsync();
}

static void ShowConnectionInfo(RemoteConfig config, DeviceHubClient hub)
{
    Console.WriteLine($"  API:        {config.ApiBaseUrl}");
    Console.WriteLine($"  Identity:   {config.IdentityBaseUrl}");
    Console.WriteLine($"  Zalogowany: {(config.IsLoggedIn ? "tak" : "nie")}");
    Console.WriteLine($"  Token ważny do: {config.TokenExpiry?.ToLocalTime():HH:mm:ss}");
    Console.WriteLine($"  Urządzenie: {config.DeviceName ?? "(brak)"} (ID: {config.DeviceId?.ToString() ?? "-"})");
    Console.WriteLine($"  Hub:        {(hub.IsConnected ? "połączony ✓" : "rozłączony ✗")}");
}

static string ReadPassword()
{
    var password = new System.Text.StringBuilder();
    while (true)
    {
        var key = Console.ReadKey(true);
        if (key.Key == ConsoleKey.Enter) { Console.WriteLine(); break; }
        if (key.Key == ConsoleKey.Backspace && password.Length > 0) { password.Length--; Console.Write("\b \b"); }
        else if (!char.IsControl(key.KeyChar)) { password.Append(key.KeyChar); Console.Write('*'); }
    }
    return password.ToString();
}
