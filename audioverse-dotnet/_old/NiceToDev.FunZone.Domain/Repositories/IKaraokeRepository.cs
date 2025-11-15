using NiceToDev.FunZone.Domain.Entities;
using SmartERP.CommonTools.Repositories;
using System.Linq.Expressions;

namespace NiceToDev.FunZone.Domain.Repositories
{
    public interface IKaraokeRepository : IGenericRepository
    {
        Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId);
        Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId);
        Task<List<KaraokeSongFile>> GetAllSongsAsync();
        IQueryable<KaraokeSongFile> GetSongsFilteredAsync(Expression<Func<KaraokeSongFile, bool>> predicate);
    }
}
