namespace AudioVerse.Domain.Entities.Karaoke
{
    public class KaraokeNote
    {
        public int Id { get; set; }
        public int SongId { get; set; }        
        public string NoteLine { get; set; } = string.Empty;
    }

}
