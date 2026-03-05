namespace AudioVerse.Domain.Entities.Radio
{
    /// <summary>
    /// Aktywna (lub zarchiwizowana) sesja nadawania dla stacji.
    /// </summary>
    public class BroadcastSession
    {
        public int Id { get; set; }
        public int RadioStationId { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime? EndUtc { get; set; }
        public bool IsRunning { get; set; }
        public int? PlaylistId { get; set; }
        public int? CreatedById { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
