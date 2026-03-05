using AudioVerse.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Infrastructure.Repositories
{
    public class UserProfileRepositoryEF : IUserProfileRepository
    {
        private readonly AudioVerseDbContext _dbContext;

        public UserProfileRepositoryEF(AudioVerseDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // ════════════════════════════════════════════════════════════
        //  USER PROFILES
        // ════════════════════════════════════════════════════════════

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

        public async Task<IEnumerable<UserProfile>> SearchUsersAsync(string term, int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(term) || term.Length < 3) return Enumerable.Empty<UserProfile>();
            term = term.ToLower();
            return await _dbContext.UserProfiles
                .Where(u => u.UserName!.ToLower().Contains(term) || (u.Email != null && u.Email.ToLower().Contains(term)))
                .OrderBy(u => u.UserName)
                .Take(limit)
                .ToListAsync();
        }

        // ════════════════════════════════════════════════════════════
        //  PLAYERS (User Profile Players)
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreatePlayerAsync(UserProfilePlayer player)
        {
            _dbContext.UserProfilePlayers.Add(player);
            await _dbContext.SaveChangesAsync();
            return player.Id;
        }

        public async Task<UserProfilePlayer?> GetPlayerByIdAsync(int id) =>
            await _dbContext.UserProfilePlayers.FindAsync(id);

        public async Task<IEnumerable<UserProfilePlayer>> GetPlayersByUserAsync(int userId) =>
            await _dbContext.UserProfilePlayers
                .Where(p => p.ProfileId == userId)
                .OrderBy(p => p.Name)
                .ToListAsync();

        public async Task<bool> UpdatePlayerAsync(UserProfilePlayer player)
        {
            var existing = await _dbContext.UserProfilePlayers.FindAsync(player.Id);
            if (existing == null) return false;

            existing.Name = player.Name;
            existing.PreferredColors = player.PreferredColors;
            existing.FillPattern = player.FillPattern;
            existing.IsPrimary = player.IsPrimary;
            existing.KaraokeSettings = player.KaraokeSettings;

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePlayerAsync(int id)
        {
            var player = await _dbContext.UserProfilePlayers.FindAsync(id);
            if (player == null) return false;

            _dbContext.UserProfilePlayers.Remove(player);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetPrimaryPlayerAsync(int userId, int playerId)
        {
            var players = await _dbContext.UserProfilePlayers
                .Where(p => p.ProfileId == userId)
                .ToListAsync();

            foreach (var p in players)
            {
                p.IsPrimary = p.Id == playerId;
            }

            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ── Player Links ──

        public async Task<PlayerLink?> GetActivePlayerLinkAsync(int sourcePlayerId, int targetPlayerId, CancellationToken ct = default)
            => await _dbContext.PlayerLinks.FirstOrDefaultAsync(l =>
                l.Status == AudioVerse.Domain.Enums.PlayerLinkStatus.Active &&
                ((l.SourcePlayerId == sourcePlayerId && l.TargetPlayerId == targetPlayerId) ||
                 (l.SourcePlayerId == targetPlayerId && l.TargetPlayerId == sourcePlayerId)), ct);

        public async Task<IEnumerable<PlayerLink>> GetPlayerLinksForProfileAsync(int profileId, CancellationToken ct = default)
        {
            var playerIds = await _dbContext.UserProfilePlayers
                .Where(p => p.ProfileId == profileId)
                .Select(p => p.Id)
                .ToListAsync(ct);

            return await _dbContext.PlayerLinks
                .Where(l => playerIds.Contains(l.SourcePlayerId) || playerIds.Contains(l.TargetPlayerId))
                .Include(l => l.SourcePlayer)
                .Include(l => l.TargetPlayer)
                .ToListAsync(ct);
        }

        public async Task<int> AddPlayerLinkAsync(PlayerLink link, CancellationToken ct = default)
        {
            _dbContext.PlayerLinks.Add(link);
            await _dbContext.SaveChangesAsync(ct);
            return link.Id;
        }

        public async Task<PlayerLink?> GetPlayerLinkByIdAsync(int id, CancellationToken ct = default)
            => await _dbContext.PlayerLinks
                .Include(l => l.SourcePlayer)
                .Include(l => l.TargetPlayer)
                .FirstOrDefaultAsync(l => l.Id == id, ct);

        public async Task<bool> RevokePlayerLinkAsync(int linkId, int profileId, CancellationToken ct = default)
        {
            var link = await _dbContext.PlayerLinks.FindAsync([linkId], ct);
            if (link == null) return false;
            var sourcePlayer = await _dbContext.UserProfilePlayers.FindAsync([link.SourcePlayerId], ct);
            var targetPlayer = await _dbContext.UserProfilePlayers.FindAsync([link.TargetPlayerId], ct);
            if (sourcePlayer?.ProfileId != profileId && targetPlayer?.ProfileId != profileId)
                return false;
            link.Status = AudioVerse.Domain.Enums.PlayerLinkStatus.Revoked;
            link.RevokedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(ct);
            return true;
        }

        // ════════════════════════════════════════════════════════════
        //  DEVICES
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreateDeviceAsync(UserProfileDevice device)
        {
            _dbContext.UserDevices.Add(device);
            await _dbContext.SaveChangesAsync();
            return device.Id;
        }

        public async Task<UserProfileDevice?> GetDeviceByIdAsync(int id) =>
            await _dbContext.UserDevices.FindAsync(id);

        public async Task<IEnumerable<UserProfileDevice>> GetDevicesByUserAsync(int userId) =>
            await _dbContext.UserDevices
                .Where(d => d.UserId == userId)
                .OrderBy(d => d.DeviceName)
                .ToListAsync();

        public async Task<bool> UpdateDeviceAsync(UserProfileDevice device)
        {
            var existing = await _dbContext.UserDevices.FindAsync(device.Id);
            if (existing == null) return false;

            existing.DeviceName = device.DeviceName;
            existing.UserDeviceName = device.UserDeviceName;
            existing.Visible = device.Visible;

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteDeviceAsync(int id)
        {
            var device = await _dbContext.UserDevices.FindAsync(id);
            if (device == null) return false;

            _dbContext.UserDevices.Remove(device);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ════════════════════════════════════════════════════════════
        //  MICROPHONES
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreateMicrophoneAsync(UserProfileMicrophone microphone)
        {
            _dbContext.UserMicrophones.Add(microphone);
            await _dbContext.SaveChangesAsync();
            return microphone.Id;
        }

        public async Task<UserProfileMicrophone?> GetMicrophoneByIdAsync(int id) =>
            await _dbContext.UserMicrophones.FindAsync(id);

        public async Task<IEnumerable<UserProfileMicrophone>> GetMicrophonesByUserAsync(int userId) =>
            await _dbContext.UserMicrophones
                .Where(m => m.UserId == userId)
                .OrderBy(m => m.DeviceId)
                .ToListAsync();

        public async Task<bool> UpdateMicrophoneAsync(UserProfileMicrophone microphone)
        {
            var existing = await _dbContext.UserMicrophones.FindAsync(microphone.Id);
            if (existing == null) return false;

            existing.Volume = microphone.Volume;
            existing.Threshold = microphone.Threshold;
            existing.Visible = microphone.Visible;
            existing.MicGain = microphone.MicGain;
            existing.MonitorEnabled = microphone.MonitorEnabled;
            existing.MonitorVolume = microphone.MonitorVolume;
            existing.PitchThreshold = microphone.PitchThreshold;
            existing.UpdatedAt = DateTime.UtcNow;


            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMicrophoneAsync(int id)
        {
            var mic = await _dbContext.UserMicrophones.FindAsync(id);
            if (mic == null) return false;

            _dbContext.UserMicrophones.Remove(mic);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ════════════════════════════════════════════════════════════
        //  MICROPHONE ASSIGNMENTS
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreateMicrophoneAssignmentAsync(MicrophoneAssignment assignment)
        {
            _dbContext.MicrophoneAssignments.Add(assignment);
            await _dbContext.SaveChangesAsync();
            return assignment.Id;
        }

        public async Task<MicrophoneAssignment?> GetMicrophoneAssignmentByIdAsync(int id) =>
            await _dbContext.MicrophoneAssignments.FindAsync(id);

        public async Task<IEnumerable<MicrophoneAssignment>> GetMicrophoneAssignmentsByUserAsync(int userId) =>
            await _dbContext.MicrophoneAssignments
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Slot)
                .ToListAsync();

        public async Task<IEnumerable<MicrophoneAssignment>> GetAllMicrophoneAssignmentsAsync() =>
            await _dbContext.MicrophoneAssignments
                .OrderByDescending(a => a.AssignedAt)
                .ToListAsync();

        public async Task<MicrophoneAssignment?> GetMicrophoneAssignmentBySlotAsync(int userId, int slot) =>
            await _dbContext.MicrophoneAssignments
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Slot == slot);



        public async Task<bool> UpdateMicrophoneAssignmentAsync(MicrophoneAssignment assignment)
        {
            var existing = await _dbContext.MicrophoneAssignments.FindAsync(assignment.Id);
            if (existing == null) return false;

            existing.MicrophoneId = assignment.MicrophoneId;
            existing.Color = assignment.Color;
            existing.Slot = assignment.Slot;
            existing.AssignedAt = assignment.AssignedAt;

            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteMicrophoneAssignmentAsync(int id)
        {
            var assignment = await _dbContext.MicrophoneAssignments.FindAsync(id);
            if (assignment == null) return false;

            _dbContext.MicrophoneAssignments.Remove(assignment);
            await _dbContext.SaveChangesAsync();
            return true;
        }


        // ════════════════════════════════════════════════════════════
        //  USER SETTINGS
        // ════════════════════════════════════════════════════════════

        public async Task<bool> UpdateUserSettingsAsync(int userId, string? displayName, string? avatarUrl, string? preferredLanguage)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return false;

            if (displayName != null) user.FullName = displayName;
            // AvatarUrl and PreferredLanguage may not exist on UserProfile - skip for now

            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ════════════════════════════════════════════════════════════
        //  USER PROFILE SETTINGS
        // ════════════════════════════════════════════════════════════

        public async Task<UserProfileSettings?> GetUserProfileSettingsAsync(int userId) =>
            await _dbContext.UserProfileSettings.FirstOrDefaultAsync(s => s.UserId == userId);

        public async Task<int> CreateUserProfileSettingsAsync(UserProfileSettings settings)
        {
            _dbContext.UserProfileSettings.Add(settings);
            await _dbContext.SaveChangesAsync();
            return settings.Id;
        }

        public async Task<bool> UpdateUserProfileSettingsAsync(UserProfileSettings settings)
        {
            var existing = await _dbContext.UserProfileSettings.FindAsync(settings.Id);
            if (existing == null) return false;

            existing.DeveloperMode = settings.DeveloperMode;
            existing.Jurors = settings.Jurors;
            existing.Fullscreen = settings.Fullscreen;
            existing.Theme = settings.Theme;
            existing.SoundEffects = settings.SoundEffects;
            existing.Language = settings.Language;
            existing.Difficulty = settings.Difficulty;
            existing.PitchAlgorithm = settings.PitchAlgorithm;
            existing.CompletedTutorials = settings.CompletedTutorials;
            existing.BreadcrumbsEnabled = settings.BreadcrumbsEnabled;
            existing.KaraokeDisplaySettings = settings.KaraokeDisplaySettings;
            existing.PlayerKaraokeSettings = settings.PlayerKaraokeSettings;
            existing.GamepadMapping = settings.GamepadMapping;
            existing.CustomThemes = settings.CustomThemes;
            existing.LocalPlaylists = settings.LocalPlaylists;

            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}