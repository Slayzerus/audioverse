namespace AudioVerse.Application.Models.Platforms.Tidal
{
    public sealed class CreatePlaylistRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool Public { get; set; } = false;
    }
}
