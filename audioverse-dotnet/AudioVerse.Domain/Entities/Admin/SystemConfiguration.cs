using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// System-wide configuration with history (Active flag)
    /// </summary>
    public class SystemConfiguration
    {
        public int Id { get; set; }
        public int SessionTimeoutMinutes { get; set; } = 30;
        public CaptchaOption CaptchaOption { get; set; } = CaptchaOption.Type1;
        public int MaxMicrophonePlayers { get; set; } = 4;
        // Maksymalna liczba słuchaczy per stacja jeśli ustawione (null = brak limitu per stacja)
        public int? GlobalMaxListenersPerStation { get; set; }
        // Maksymalna łączna liczba słuchaczy we wszystkich stacjach (null = brak limitu)
        public int? GlobalMaxTotalListeners { get; set; }
        public bool Active { get; set; } = true;
        public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
        public int? ModifiedByUserId { get; set; }
        public string? ModifiedByUsername { get; set; }

        /// <summary>Nadpisania widoczności feature'ów UI (delta od domyślnych).</summary>
        public List<FeatureVisibilityOverride> FeatureVisibilityOverrides { get; set; } = [];
    }
}
