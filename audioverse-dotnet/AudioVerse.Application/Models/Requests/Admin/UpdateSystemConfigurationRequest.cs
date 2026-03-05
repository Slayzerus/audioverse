using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models.Requests.Admin
{
    public class UpdateSystemConfigurationRequest
    {
        public int SessionTimeoutMinutes { get; set; } = 30;
        public CaptchaOption CaptchaOption { get; set; } = CaptchaOption.Type1;
        public int MaxMicrophonePlayers { get; set; } = 4;
        public bool Active { get; set; } = true;
    }
}
