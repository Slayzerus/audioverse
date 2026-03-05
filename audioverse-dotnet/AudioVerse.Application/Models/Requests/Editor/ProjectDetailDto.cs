namespace AudioVerse.Application.Models.Requests.Editor;

public class ProjectDetailDto : ProjectDto
{
    public List<SectionDto> Sections { get; set; } = new();
    public List<TrackDto> Tracks { get; set; } = new();
}
