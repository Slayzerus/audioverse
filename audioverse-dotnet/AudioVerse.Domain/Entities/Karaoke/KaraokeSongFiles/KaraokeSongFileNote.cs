namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles
{
    public class KaraokeSongFileNote
    {
        public int Id { get; set; }
        public int SongId { get; set; }        
        public string NoteLine { get; set; } = string.Empty;
    }

}
