namespace AudioVerse.Application.Models.Karaoke
{
    public class KaraokeTopSingingDto
    {
        public int SingingId { get; set; }
        public int RoundId { get; set; }
        public int PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int Score { get; set; }
        public int Hits { get; set; }
        public int Misses { get; set; }
        public int Good { get; set; }
        public int Perfect { get; set; }
        public int Combo { get; set; }
        public DateTime PerformedAt { get; set; }
    }
}
