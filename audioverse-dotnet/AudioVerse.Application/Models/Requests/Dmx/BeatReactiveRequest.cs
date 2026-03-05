namespace AudioVerse.API.Areas.DMX.Controllers;

public class BeatReactiveRequest
{
    public decimal Bpm { get; set; }
    public int? SceneId { get; set; }
    public int Beats { get; set; } = 16;
}
