using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models
{
    public class DeviceDto
    {
        public int Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string UserDeviceName { get; set; } = string.Empty;
        public DeviceType DeviceType { get; set; }
        public bool Visible { get; set; }
    }
}
