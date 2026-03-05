namespace AudioVerse.Domain.Entities.Radio
{
    /// <summary>
    /// Rejestr wejścia/wyjścia słuchacza (używane do limitów i statystyk).
    /// </summary>
    public class RadioListener
    {
        public int Id { get; set; }
        public int RadioStationId { get; set; }
        public int? BroadcastSessionId { get; set; }
        public int? UserId { get; set; }
        public string? ConnectionId { get; set; }
        public string? ClientInfo { get; set; }
        public string? RemoteIp { get; set; }
        public DateTime ConnectedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? DisconnectedAtUtc { get; set; }
    }
}
