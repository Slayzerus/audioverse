using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models.Requests.User
{
    public class CreateDeviceRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string UserDeviceName { get; set; } = string.Empty;
        public DeviceType DeviceType { get; set; } = DeviceType.Unknown;
        public bool Visible { get; set; } = true;
    }
}
