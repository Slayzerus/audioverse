namespace AudioVerse.Application.Models.Audio
{
    public class CreatePlaylistRequest
    {
        public string Platform { get; set; } = "local";
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public List<string> TrackIds { get; set; } = new();
    }
}

