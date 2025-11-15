namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokeNote
    {
        public int Id { get; set; }
        public int SongId { get; set; }
        public KaraokeSongFile Song { get; set; } = null!;
        public string NoteLine { get; set; } = string.Empty;    
    }

}
