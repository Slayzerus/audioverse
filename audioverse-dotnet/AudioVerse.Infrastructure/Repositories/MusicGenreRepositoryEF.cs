using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories
{
    public class MusicGenreRepositoryEF : IMusicGenreRepository
    {
        private readonly AudioVerseDbContext _db;
        public MusicGenreRepositoryEF(AudioVerseDbContext db) => _db = db;

        public async Task<int> CreateAsync(MusicGenre genre)
        {
            _db.MusicGenres.Add(genre);
            await _db.SaveChangesAsync();
            return genre.Id;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var g = await _db.MusicGenres.FindAsync(id);
            if (g == null) return false;
            _db.MusicGenres.Remove(g);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MusicGenre>> GetAllAsync()
            => await _db.MusicGenres.Include(g => g.SubGenres).ToListAsync();

        public async Task<MusicGenre?> GetByIdAsync(int id)
            => await _db.MusicGenres.Include(g => g.SubGenres).FirstOrDefaultAsync(g => g.Id == id);

        public async Task<MusicGenre?> GetByNameAsync(string name)
            => await _db.MusicGenres.FirstOrDefaultAsync(g => g.Name == name);

        public async Task<bool> UpdateAsync(MusicGenre genre)
        {
            var existing = await _db.MusicGenres.FindAsync(genre.Id);
            if (existing == null) return false;
            existing.Name = genre.Name;
            existing.ParentGenreId = genre.ParentGenreId;
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
