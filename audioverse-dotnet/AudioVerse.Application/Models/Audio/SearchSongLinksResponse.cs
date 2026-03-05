using AudioVerse.Application.Models.SongInformations;

namespace AudioVerse.Application.Models.Audio
{
    public sealed class SearchSongLinksResponse
    {
        public List<SongInformation> Songs { get; set; } = new();
    }
}
