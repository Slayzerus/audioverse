using System.Threading.Tasks;
using AudioVerse.Domain.Entities;

namespace AudioVerse.Domain.Repositories
{
    public interface IUserProfileRepository
    {
        Task<UserProfile?> GetByUsernameAsync(string username);
        Task<UserProfile?> GetByEmailAsync(string email);
        Task<UserProfile?> GetByIdAsync(int id);
        Task CreateAsync(UserProfile user);
        Task UpdateAsync(UserProfile user);
        Task DeleteAsync(int id);
        Task<IEnumerable<UserProfile>> GetAllUsersAsync();
        Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count);
        Task AddPasswordHistoryAsync(PasswordHistory passwordHistory);
    }
}
