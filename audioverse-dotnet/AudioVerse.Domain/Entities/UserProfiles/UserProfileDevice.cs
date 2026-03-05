using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.UserProfiles
{
    public class UserProfileDevice
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string UserDeviceName { get; set; } = string.Empty;
        public DeviceType DeviceType { get; set; } = DeviceType.Unknown;
        public bool Visible { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public UserProfile? User { get; set; }
    }
}
