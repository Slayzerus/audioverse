namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class RemoveTracksRequest
    {
        public List<string> TrackUrisOrIds { get; set; } = new();
    }
}
