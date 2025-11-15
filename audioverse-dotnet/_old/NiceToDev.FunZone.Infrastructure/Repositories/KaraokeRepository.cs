using Microsoft.EntityFrameworkCore;
using NiceToDev.FunZone.Domain.Entities;
using NiceToDev.FunZone.Domain.Repositories;
using NiceToDev.FunZone.Infrastructure.Database;
using SmartERP.CommonTools.Repositories;
using System.Linq.Expressions;

namespace NiceToDev.FunZone.Infrastructure.Repositories
{
    public class KaraokeRepository : GenericRepository, IKaraokeRepository
    {
        private readonly KaraokeDbContext _context;

        public KaraokeRepository(KaraokeDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<KaraokeParty?> GetPartyWithPlayersAsync(int partyId)
        {
            return await _context.KaraokeParties
                .Include(p => p.PartyPlayers)
                .ThenInclude(pp => pp.Player)
                .FirstOrDefaultAsync(p => p.Id == partyId);
        }

        public async Task<KaraokePlaylist?> GetPlaylistWithSongsAsync(int playlistId)
        {
            return await _context.KaraokePlaylists
                .Include(p => p.PlaylistSongs)
                .ThenInclude(ps => ps.Song)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
        }

        public async Task<List<KaraokeSongFile>> GetAllSongsAsync()
        {
            return await _context.KaraokeSongs.ToListAsync();
        }

        public IQueryable<KaraokeSongFile> GetSongsFilteredAsync(Expression<Func<KaraokeSongFile, bool>> predicate)
        {
            return _context.KaraokeSongs.Where(predicate);
        }
    }


}
