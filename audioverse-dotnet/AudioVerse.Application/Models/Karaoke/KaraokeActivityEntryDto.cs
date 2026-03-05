using System;

namespace AudioVerse.Application.Models.Karaoke
{
    public class KaraokeActivityEntryDto
    {
        public DateTime Date { get; set; }
        public int SongsSung { get; set; }
        public int TotalScore { get; set; }
    }
}
