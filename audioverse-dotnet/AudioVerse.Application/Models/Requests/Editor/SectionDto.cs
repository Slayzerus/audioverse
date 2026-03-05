namespace AudioVerse.Application.Models.Requests.Editor;

public class SectionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public double BPM { get; set; }
    public double Duration { get; set; }
    public List<TrackDto> Tracks { get; set; } = new();
}
