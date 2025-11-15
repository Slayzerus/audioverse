using NiceToDev.FunZone.Domain.Entities;
using SmartERP.CommonTools.Services;
using System.Linq.Expressions;

namespace NiceToDev.FunZone.Application.Interfaces
{
    public interface IKaraokeService : IGenericService
    {
        Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId);
        Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId);
        Task<List<KaraokeSongFile>> SortSongsAsync(Func<KaraokeSongFile, object> keySelector, bool ascending = true);
        Task<List<KaraokeSongFile>> FilterSongsAsync(Expression<Func<KaraokeSongFile, bool>> predicate);
        Task<List<KaraokeSongFile>> ScanFolderAsync(string folderPath);
        Task UpdateSongsAsync(List<KaraokeSongFile> songs, Action<KaraokeSongFile> updateAction);
    }
}
