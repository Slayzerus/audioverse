namespace AudioVerse.API.Hubs
{
    /// <summary>
    /// Urządzenie podłączone przez SignalR do DeviceHub.
    /// </summary>
    public class ConnectedDevice
    {
        public string ConnectionId { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
    }
}
