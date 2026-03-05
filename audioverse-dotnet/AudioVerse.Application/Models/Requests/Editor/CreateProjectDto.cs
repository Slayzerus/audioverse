namespace AudioVerse.Application.Models.Requests.Editor;

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public int BPM { get; set; } = 120;
}
