using System.Net.Http.Json;
using System.Text.Json;

namespace AudioVerse.Remote
{
    /// <summary>
    /// Klient HTTP do AudioVerse API — tylko auth i rejestracja urządzenia.
    /// Cała komunikacja real-time idzie przez SignalR (DeviceHub).
    /// </summary>
    public class ApiClient : IDisposable
    {
        private readonly HttpClient _http;
        private readonly RemoteConfig _config;

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public ApiClient(RemoteConfig config)
        {
            _config = config;
            _http = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(15)
            };
        }

        /// <summary>
        /// Logowanie przez OpenIddict password flow (IdentityServer).
        /// </summary>
        public async Task<bool> LoginAsync(string username, string password)
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["username"] = username,
                ["password"] = password
            });

            var url = $"{_config.IdentityBaseUrl.TrimEnd('/')}/connect/token";
            HttpResponseMessage resp;
            try
            {
                resp = await _http.PostAsync(url, content);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Błąd połączenia: {ex.Message}");
                return false;
            }

            if (!resp.IsSuccessStatusCode)
            {
                var error = await resp.Content.ReadAsStringAsync();
                Console.WriteLine($"  Logowanie nieudane ({resp.StatusCode}): {error}");
                return false;
            }

            var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
            _config.AccessToken = json.GetProperty("access_token").GetString();
            _config.RefreshToken = json.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;

            var expiresIn = json.TryGetProperty("expires_in", out var ei) ? ei.GetInt32() : 1800;
            _config.TokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn);
            _config.Save();
            return true;
        }

        /// <summary>
        /// Rejestracja urządzenia w AudioVerse API (POST /api/user/devices).
        /// </summary>
        public async Task<int?> RegisterDeviceAsync(string deviceName, string deviceType)
        {
            SetAuthHeader();

            var apiUrl = $"{_config.ApiBaseUrl.TrimEnd('/')}/api/user/devices";
            var body = new
            {
                DeviceId = Environment.MachineName,
                DeviceName = deviceName,
                UserDeviceName = $"{deviceName} ({Environment.MachineName})",
                DeviceType = deviceType switch
                {
                    "dmx" => 7,
                    "audio" => 5,
                    _ => 0
                },
                Visible = true
            };

            try
            {
                var resp = await _http.PostAsJsonAsync(apiUrl, body);
                if (!resp.IsSuccessStatusCode)
                {
                    Console.WriteLine($"  Rejestracja urządzenia nieudana ({resp.StatusCode})");
                    return null;
                }

                var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
                if (json.TryGetProperty("deviceId", out var did))
                    return did.GetInt32();
                if (json.TryGetProperty("DeviceId", out var did2))
                    return did2.GetInt32();
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Błąd: {ex.Message}");
                return null;
            }
        }

        /// <summary>Pobiera listę urządzeń użytkownika.</summary>
        public async Task<JsonElement?> GetDevicesAsync()
        {
            SetAuthHeader();
            var url = $"{_config.ApiBaseUrl.TrimEnd('/')}/api/user/devices";
            try
            {
                var resp = await _http.GetAsync(url);
                if (!resp.IsSuccessStatusCode) return null;
                return await resp.Content.ReadFromJsonAsync<JsonElement>();
            }
            catch
            {
                return null;
            }
        }

        private void SetAuthHeader()
        {
            if (!string.IsNullOrEmpty(_config.AccessToken))
                _http.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _config.AccessToken);
        }

        public void Dispose() => _http.Dispose();
    }
}
