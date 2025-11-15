using AudioVerse.Domain.Entities.Karaoke;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AudioVerse.Domain.Repositories
{
    public interface IKaraokeRepository
    {
        Task<KaraokeSongFile?> GetSongByIdAsync(int id);
        Task<KaraokeParty?> GetPartyByIdAsync(int id);
        Task<IEnumerable<KaraokeParty>> GetAllPartiesAsync();
        Task<IEnumerable<KaraokePlayer>> GetAllPlayersAsync();
        Task<IEnumerable<KaraokeSongFile>> FilterSongsAsync(string? title, string? artist, string? genre, string? language, int? year);
        Task<int> CreatePartyAsync(KaraokeParty party);
        Task<int> CreatePlayerAsync(KaraokePlayer player);
        Task<bool> AssignPlayerToPartyAsync(KaraokePartyPlayer partyPlayer);
        Task<int> AddRoundAsync(KaraokePartyRound round);
        Task<int> AddSongToRoundAsync(KaraokeSinging singing);
        Task<bool> SaveSingingResultsAsync(IEnumerable<KaraokeSinging> results);
        Task<IEnumerable<KaraokeSongFile>> ScanFolderAsync(string folderPath);

        Task<List<KaraokeSongFile>> GetAllSongsAsync();

        Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId);

        Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId);

        Task<KaraokeSongFile?> ParseUltrastarSong(string filePath);

        Task<KaraokeSongFile?> ParseUltrastarSong(byte[] fileData, string fileName = "uploaded.txt");

        Task<KaraokeSongFile?> ParseUltrastarSong(string[] lines, string filePath);
    }
}
