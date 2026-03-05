using System;

namespace AudioVerse.Application.Models.Karaoke
{
    public class KaraokeHistoryEntryDto
    {
        public int SingingId { get; set; }
        public string SongTitle { get; set; } = string.Empty;
        public int Score { get; set; }
        public DateTime PerformedAt { get; set; }
    }
}
