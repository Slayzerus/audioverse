using System.Threading.Tasks;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Repositories
{
    /// <summary>
    /// Repository for user profiles, players, devices, microphones, settings, refresh tokens, and external accounts.
    /// </summary>
    public interface IUserProfileRepository
    {
        // ════════════════════════════════════════════════════════════
        //  USER PROFILES
        // ════════════════════════════════════════════════════════════
        
        Task<UserProfile?> GetByUsernameAsync(string username);
        Task<UserProfile?> GetByEmailAsync(string email);
        Task<UserProfile?> GetByIdAsync(int id);
        Task CreateAsync(UserProfile user);
        Task UpdateAsync(UserProfile user);
        Task DeleteAsync(int id);
        Task<IEnumerable<UserProfile>> GetAllUsersAsync();
        Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count);
        Task AddPasswordHistoryAsync(PasswordHistory passwordHistory);
        Task<IEnumerable<UserProfile>> SearchUsersAsync(string term, int limit = 20);

        // ════════════════════════════════════════════════════════════
        //  PLAYERS (User Profile Players)
        // ════════════════════════════════════════════════════════════

        Task<int> CreatePlayerAsync(UserProfilePlayer player);
        Task<UserProfilePlayer?> GetPlayerByIdAsync(int id);
        Task<IEnumerable<UserProfilePlayer>> GetPlayersByUserAsync(int userId);
        Task<bool> UpdatePlayerAsync(UserProfilePlayer player);
        Task<bool> DeletePlayerAsync(int id);
        Task<bool> SetPrimaryPlayerAsync(int userId, int playerId);

        // ── Player Links ──
        Task<PlayerLink?> GetActivePlayerLinkAsync(int sourcePlayerId, int targetPlayerId, CancellationToken ct = default);
        Task<IEnumerable<PlayerLink>> GetPlayerLinksForProfileAsync(int profileId, CancellationToken ct = default);
        Task<int> AddPlayerLinkAsync(PlayerLink link, CancellationToken ct = default);
        Task<PlayerLink?> GetPlayerLinkByIdAsync(int id, CancellationToken ct = default);
        Task<bool> RevokePlayerLinkAsync(int linkId, int profileId, CancellationToken ct = default);

        // ════════════════════════════════════════════════════════════
        //  DEVICES
        // ════════════════════════════════════════════════════════════

        Task<int> CreateDeviceAsync(UserProfileDevice device);
        Task<UserProfileDevice?> GetDeviceByIdAsync(int id);
        Task<IEnumerable<UserProfileDevice>> GetDevicesByUserAsync(int userId);
        Task<bool> UpdateDeviceAsync(UserProfileDevice device);
        Task<bool> DeleteDeviceAsync(int id);

        // ════════════════════════════════════════════════════════════
        //  MICROPHONES
        // ════════════════════════════════════════════════════════════

        Task<int> CreateMicrophoneAsync(UserProfileMicrophone microphone);
        Task<UserProfileMicrophone?> GetMicrophoneByIdAsync(int id);
        Task<IEnumerable<UserProfileMicrophone>> GetMicrophonesByUserAsync(int userId);
        Task<bool> UpdateMicrophoneAsync(UserProfileMicrophone microphone);
        Task<bool> DeleteMicrophoneAsync(int id);

        // ════════════════════════════════════════════════════════════
        //  MICROPHONE ASSIGNMENTS
        // ════════════════════════════════════════════════════════════

        Task<int> CreateMicrophoneAssignmentAsync(MicrophoneAssignment assignment);
        Task<MicrophoneAssignment?> GetMicrophoneAssignmentByIdAsync(int id);
        Task<IEnumerable<MicrophoneAssignment>> GetMicrophoneAssignmentsByUserAsync(int userId);
        Task<IEnumerable<MicrophoneAssignment>> GetAllMicrophoneAssignmentsAsync();
        Task<MicrophoneAssignment?> GetMicrophoneAssignmentBySlotAsync(int userId, int slot);
        Task<bool> UpdateMicrophoneAssignmentAsync(MicrophoneAssignment assignment);
        Task<bool> DeleteMicrophoneAssignmentAsync(int id);


        // ════════════════════════════════════════════════════════════
        //  USER PROFILE SETTINGS
        // ════════════════════════════════════════════════════════════

        Task<bool> UpdateUserSettingsAsync(int userId, string? displayName, string? avatarUrl, string? preferredLanguage);
        Task<UserProfileSettings?> GetUserProfileSettingsAsync(int userId);
        Task<int> CreateUserProfileSettingsAsync(UserProfileSettings settings);
        Task<bool> UpdateUserProfileSettingsAsync(UserProfileSettings settings);
    }
}
