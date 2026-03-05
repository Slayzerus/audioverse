using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories
{
    public class PlaylistRepositoryEF : IPlaylistRepository
    {
        private readonly AudioVerseDbContext _db;
        public PlaylistRepositoryEF(AudioVerseDbContext db) => _db = db;

        public async Task<int> AddItemAsync(int playlistId, int songId, int orderNumber)
        {
            var item = new PlaylistItem { PlaylistId = playlistId, SongId = songId, OrderNumber = orderNumber };
            _db.PlaylistItems.Add(item);
            await _db.SaveChangesAsync();
            return item.Id;
        }

        public async Task<int> CreateAsync(Playlist playlist)
        {
            _db.Playlists.Add(playlist);
            await _db.SaveChangesAsync();
            return playlist.Id;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var p = await _db.Playlists.FindAsync(id);
            if (p == null) return false;
            _db.Playlists.Remove(p);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Playlist>> GetAllAsync()
        {
            return await _db.Playlists.Include(p => p.Items).ThenInclude(i => i.Song).ToListAsync();
        }

        public async Task<Playlist?> GetByIdAsync(int id, bool includeChildren = false, int maxDepth = 1)
        {
            var query = _db.Playlists.Include(p => p.Items).ThenInclude(i => i.Song).AsQueryable();
            if (includeChildren)
                query = query.Include(p => p.Children);

            var playlist = await query.FirstOrDefaultAsync(p => p.Id == id);
            if (playlist != null && includeChildren && maxDepth > 1)
                await LoadPlaylistChildrenAsync(playlist, maxDepth - 1);

            return playlist;
        }

        private async Task LoadPlaylistChildrenAsync(Playlist parent, int remainingDepth)
        {
            if (remainingDepth <= 0) return;
            await _db.Entry(parent).Collection(p => p.Children).Query()
                .Include(p => p.Items).ThenInclude(i => i.Song)
                .Include(p => p.Children)
                .LoadAsync();
            foreach (var child in parent.Children)
                await LoadPlaylistChildrenAsync(child, remainingDepth - 1);
        }

        public async Task<bool> RemoveItemAsync(int id)
        {
            var it = await _db.PlaylistItems.FindAsync(id);
            if (it == null) return false;
            _db.PlaylistItems.Remove(it);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateAsync(Playlist playlist)
        {
            var existing = await _db.Playlists.FindAsync(playlist.Id);
            if (existing == null) return false;
            existing.Name = playlist.Name;
            existing.Description = playlist.Description;
            existing.Access = playlist.Access;
            existing.AccessCode = playlist.AccessCode;
            existing.Modified = DateTime.UtcNow;
            existing.ModifiedBy = playlist.ModifiedBy;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
