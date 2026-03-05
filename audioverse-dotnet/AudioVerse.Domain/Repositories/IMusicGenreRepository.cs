using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for music genre CRUD operations.
    /// </summary>
    public interface IMusicGenreRepository
    {
        Task<IEnumerable<MusicGenre>> GetAllAsync();
        Task<MusicGenre?> GetByIdAsync(int id);
        Task<MusicGenre?> GetByNameAsync(string name);
        Task<int> CreateAsync(MusicGenre genre);
        Task<bool> UpdateAsync(MusicGenre genre);
        Task<bool> DeleteAsync(int id);
    }
}