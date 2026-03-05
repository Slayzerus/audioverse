namespace AudioVerse.API.Models.Admin
{
    public class SystemConfigurationDto
    {
        public int Id { get; set; }
        public int SessionTimeoutMinutes { get; set; }
        public int CaptchaOption { get; set; }
        public int MaxMicrophonePlayers { get; set; }
        public int? GlobalMaxListenersPerStation { get; set; }
        public int? GlobalMaxTotalListeners { get; set; }
        public bool Active { get; set; }
        public DateTime ModifiedAt { get; set; }
        public int? ModifiedByUserId { get; set; }
        public string? ModifiedByUsername { get; set; }

        /// <summary>Nadpisania widoczności feature'ów UI.</summary>
        public List<FeatureVisibilityOverrideDto> FeatureVisibilityOverrides { get; set; } = [];
    }
}
