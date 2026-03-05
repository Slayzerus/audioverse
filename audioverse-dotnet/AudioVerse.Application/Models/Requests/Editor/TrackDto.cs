namespace AudioVerse.Application.Models.Requests.Editor;

public class TrackDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Volume { get; set; } = 100;
    public List<ClipDto> Clips { get; set; } = new();
}
