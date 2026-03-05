namespace AudioVerse.Application.Models.Requests.Editor;

public class ClipDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double StartPosition { get; set; }
    public double Duration { get; set; }
    public string SourcePath { get; set; } = string.Empty;
}
