using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for playlist CRUD operations and playlist item management.
    /// </summary>
    public interface IPlaylistRepository
    {
        Task<IEnumerable<Playlist>> GetAllAsync();
        Task<Playlist?> GetByIdAsync(int id, bool includeChildren = false, int maxDepth = 1);
        Task<int> CreateAsync(Playlist playlist);
        Task<bool> UpdateAsync(Playlist playlist);
        Task<bool> DeleteAsync(int id);
        Task<int> AddItemAsync(int playlistId, int songId, int orderNumber);
        Task<bool> RemoveItemAsync(int id);
    }
}