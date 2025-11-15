using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Infrastructure.Repositories
{
    public class UserProfileRepositoryEF : IUserProfileRepository
    {
        private readonly AudioVerseDbContext _dbContext;

        public UserProfileRepositoryEF(AudioVerseDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UserProfile?> GetByUsernameAsync(string username) =>
            await _dbContext.UserProfiles
                .Include(u => u.Players)
                .Include(u => u.PasswordHistories)
                .FirstOrDefaultAsync(u => u.UserName == username);

        public async Task<UserProfile?> GetByEmailAsync(string email) =>
            await _dbContext.UserProfiles
                .Include(u => u.Players)
                .Include(u => u.PasswordHistories)
                .FirstOrDefaultAsync(u => u.Email == email);

        public async Task<UserProfile?> GetByIdAsync(int id) =>
            await _dbContext.UserProfiles
                .Include(u => u.Players)
                .Include(u => u.PasswordHistories)
                .FirstOrDefaultAsync(u => u.Id == id);

        public async Task CreateAsync(UserProfile user)
        {
            _dbContext.UserProfiles.Add(user);
            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserProfile user)
        {
            _dbContext.UserProfiles.Update(user);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var user = await _dbContext.UserProfiles.FindAsync(id);
            if (user != null)
            {
                _dbContext.UserProfiles.Remove(user);
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<UserProfile>> GetAllUsersAsync() =>
            await _dbContext.UserProfiles
                .Include(u => u.Players)
                .OrderBy(u => u.UserName)
                .ToListAsync();

        public async Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count) =>
            await _dbContext.Set<PasswordHistory>()
                .Where(ph => ph.UserProfileId == userId)
                .OrderByDescending(ph => ph.CreatedAt)
                .Take(count)
                .ToListAsync();

        public async Task AddPasswordHistoryAsync(PasswordHistory passwordHistory)
        {
            _dbContext.Set<PasswordHistory>().Add(passwordHistory);
            await _dbContext.SaveChangesAsync();
        }
    }
}