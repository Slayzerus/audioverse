namespace AudioVerse.Application.Queries.Admin;

public class TopSongDto
{
    public int SongId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public int TimesPlayed { get; set; }
}
