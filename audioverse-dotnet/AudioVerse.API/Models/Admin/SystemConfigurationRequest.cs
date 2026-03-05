namespace AudioVerse.API.Models.Admin
{
    public class SystemConfigurationRequest
    {
        public int SessionTimeoutMinutes { get; set; } = 30;
        public int CaptchaOption { get; set; } = 0;
        public int MaxMicrophonePlayers { get; set; } = 4;
        public int? GlobalMaxListenersPerStation { get; set; }
        public int? GlobalMaxTotalListeners { get; set; }
        public bool Active { get; set; } = true;
    }
}
