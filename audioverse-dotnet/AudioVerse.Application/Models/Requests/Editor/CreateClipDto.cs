namespace AudioVerse.Application.Models.Requests.Editor;

public class CreateClipDto
{
    public string Name { get; set; } = "Clip";
    public double StartTime { get; set; } = 0;
    public double Duration { get; set; } = 4.0;
    public string SourcePath { get; set; } = string.Empty;
}
