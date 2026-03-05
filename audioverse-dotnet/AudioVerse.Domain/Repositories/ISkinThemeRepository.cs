using AudioVerse.Domain.Entities.Design;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for UI skin theme CRUD, activation, and soft-delete operations.
    /// </summary>
    public interface ISkinThemeRepository
    {
        Task<IEnumerable<SkinTheme>> GetAllAsync(bool includeDeleted = false);
        Task<IEnumerable<SkinTheme>> GetActiveAsync();
        Task<SkinTheme?> GetByIdAsync(int id);
        Task<SkinTheme?> GetByNameAsync(string name);
        Task<int> CreateAsync(SkinTheme theme);
        Task<bool> UpdateAsync(SkinTheme theme);
        Task<bool> SoftDeleteAsync(int id);
        Task<bool> HardDeleteAsync(int id);
        Task<bool> ActivateAsync(int id, bool isActive);
        Task<int> CountActiveAsync();
    }
}
