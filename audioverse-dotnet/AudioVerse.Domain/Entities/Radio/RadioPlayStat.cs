namespace AudioVerse.Domain.Entities.Radio
{
    /// <summary>
    /// Statystyka zdarzenia dotyczącego odtwarzania / słuchania.
    /// Pozwala gromadzić kto, kiedy i co słuchał.
    /// </summary>
    public class RadioPlayStat
    {
        public int Id { get; set; }
        public int RadioStationId { get; set; }
        public int? BroadcastSessionId { get; set; }
        public int? AudioFileId { get; set; }
        public int? UserId { get; set; }
        public RadioEventType EventType { get; set; }
        public double? PositionSeconds { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
        public string? Extra { get; set; }
    }
}
