using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models
{
    public class SystemConfigurationDto
    {
        public int Id { get; set; }
        public int SessionTimeoutMinutes { get; set; }
        public CaptchaOption CaptchaOption { get; set; }
        public int MaxMicrophonePlayers { get; set; }
        public bool Active { get; set; }
        public DateTime ModifiedAt { get; set; }
        public int? ModifiedByUserId { get; set; }
        public string? ModifiedByUsername { get; set; }
    }
}
