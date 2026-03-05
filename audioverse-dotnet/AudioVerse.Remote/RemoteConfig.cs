namespace AudioVerse.Remote
{
    /// <summary>
    /// Konfiguracja połączenia z AudioVerse API.
    /// </summary>
    public class RemoteConfig
    {
        private const string ConfigFile = "audioverse-remote.json";

        public string ApiBaseUrl { get; set; } = "https://api.audioverse.io";
        public string IdentityBaseUrl { get; set; } = "https://identity.audioverse.io";
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? TokenExpiry { get; set; }
        public string? DeviceName { get; set; }
        public int? DeviceId { get; set; }

        public bool IsLoggedIn => !string.IsNullOrEmpty(AccessToken) && TokenExpiry > DateTime.UtcNow;

        public static RemoteConfig Load()
        {
            var path = Path.Combine(AppContext.BaseDirectory, ConfigFile);
            if (!File.Exists(path))
                return new RemoteConfig();

            var json = File.ReadAllText(path);
            return System.Text.Json.JsonSerializer.Deserialize<RemoteConfig>(json) ?? new RemoteConfig();
        }

        public void Save()
        {
            var path = Path.Combine(AppContext.BaseDirectory, ConfigFile);
            var json = System.Text.Json.JsonSerializer.Serialize(this, new System.Text.Json.JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(path, json);
        }

        public void ClearAuth()
        {
            AccessToken = null;
            RefreshToken = null;
            TokenExpiry = null;
            Save();
        }
    }
}
