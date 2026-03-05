namespace AudioVerse.Application.Models.Karaoke
{
    public class KaraokeRankingEntryDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public int TotalScore { get; set; }
        public int SongsSung { get; set; }
        public int BestScore { get; set; }
    }
}
