using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories
{
    public class SkinThemeRepositoryEF : ISkinThemeRepository
    {
        private readonly AudioVerseDbContext _db;

        public SkinThemeRepositoryEF(AudioVerseDbContext db) => _db = db;

        public async Task<IEnumerable<SkinTheme>> GetAllAsync(bool includeDeleted = false)
        {
            var query = includeDeleted
                ? _db.SkinThemes.IgnoreQueryFilters()
                : _db.SkinThemes.AsQueryable();

            return await query.OrderBy(s => s.SortOrder).ToListAsync();
        }

        public async Task<IEnumerable<SkinTheme>> GetActiveAsync()
            => await _db.SkinThemes
                .Where(s => s.IsActive)
                .OrderBy(s => s.SortOrder)
                .ToListAsync();

        public async Task<SkinTheme?> GetByIdAsync(int id)
            => await _db.SkinThemes.FindAsync(id);

        public async Task<SkinTheme?> GetByNameAsync(string name)
            => await _db.SkinThemes.FirstOrDefaultAsync(s => s.Name == name);

        public async Task<int> CreateAsync(SkinTheme theme)
        {
            _db.SkinThemes.Add(theme);
            await _db.SaveChangesAsync();
            return theme.Id;
        }

        public async Task<bool> UpdateAsync(SkinTheme theme)
        {
            var existing = await _db.SkinThemes.FindAsync(theme.Id);
            if (existing == null) return false;

            existing.Name = theme.Name;
            existing.Emoji = theme.Emoji;
            existing.Description = theme.Description;
            existing.IsDark = theme.IsDark;
            existing.BodyBackground = theme.BodyBackground;
            existing.Vars = theme.Vars;
            existing.IsActive = theme.IsActive;
            existing.SortOrder = theme.SortOrder;
            existing.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteAsync(int id)
        {
            var theme = await _db.SkinThemes.FindAsync(id);
            if (theme == null) return false;

            theme.IsDeleted = true;
            theme.IsActive = false;
            theme.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HardDeleteAsync(int id)
        {
            var theme = await _db.SkinThemes.FindAsync(id);
            if (theme == null) return false;

            _db.SkinThemes.Remove(theme);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateAsync(int id, bool isActive)
        {
            var theme = await _db.SkinThemes.FindAsync(id);
            if (theme == null) return false;

            theme.IsActive = isActive;
            theme.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> CountActiveAsync()
            => await _db.SkinThemes.CountAsync(s => s.IsActive);
    }
}
