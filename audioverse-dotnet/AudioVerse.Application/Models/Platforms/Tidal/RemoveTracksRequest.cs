namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class RemoveTracksRequest
    {
        public List<string> TrackIds { get; set; } = new();
    }
}
