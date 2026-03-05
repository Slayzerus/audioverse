namespace AudioVerse.Application.Models.Audio
{
    public record PlaylistResult(string Platform, string PlaylistId, string? Url, int TracksAdded);
}
