namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class AddTracksRequest
    {
        public List<string> TrackIds { get; set; } = new();
    }
}
