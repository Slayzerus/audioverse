using Dapper;
using AudioVerse.Domain.Repositories;
using System.Data;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Auth;
using System.Text.Json;

namespace AudioVerse.Infrastructure.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly IDbConnection _db;

        public UserProfileRepository(IDbConnection db)
        {
            _db = db;
        }

        public async Task<UserProfile?> GetByUsernameAsync(string username)
        {
            string sql = "SELECT * FROM UserProfiles WHERE UserName = @Username";
            return await _db.QueryFirstOrDefaultAsync<UserProfile>(sql, new { Username = username });
        }

        public async Task<UserProfile?> GetByEmailAsync(string email)
        {
            string sql = "SELECT * FROM UserProfiles WHERE Email = @Email";
            return await _db.QueryFirstOrDefaultAsync<UserProfile>(sql, new { Email = email });
        }

        public async Task<UserProfile?> GetByIdAsync(int id)
        {
            string sql = "SELECT * FROM UserProfiles WHERE Id = @Id";
            var user = await _db.QueryFirstOrDefaultAsync<UserProfile>(sql, new { Id = id });

            if (user != null)
            {
                string playersSql = "SELECT * FROM UserProfilePlayers WHERE ProfileId = @Id";
                user.Players = (await _db.QueryAsync<UserProfilePlayer>(playersSql, new { Id = id })).AsList();
            }

            return user;
        }

        public async Task CreateAsync(UserProfile user)
        {
            string sql = @"
                INSERT INTO UserProfiles (UserName, Email, PasswordHash, RefreshToken, RefreshTokenExpiryTime) 
                VALUES (@UserName, @Email, @PasswordHash, @RefreshToken, @RefreshTokenExpiryTime) 
                RETURNING Id";

            user.Id = await _db.ExecuteScalarAsync<int>(sql, user);
        }

        public async Task UpdateAsync(UserProfile user)
        {
            string sql = @"
                UPDATE UserProfiles 
                SET Username = @Username, 
                    Email = @Email, 
                    PasswordHash = @PasswordHash,
                    RefreshToken = @RefreshToken, 
                    RefreshTokenExpiryTime = @RefreshTokenExpiryTime 
                WHERE Id = @Id";

            await _db.ExecuteAsync(sql, user);
        }

        public async Task DeleteAsync(int id)
        {
            string sql = @"DELETE FROM UserProfiles WHERE Id = @Id";
            await _db.ExecuteAsync(sql, id);
        }

        public async Task<IEnumerable<UserProfile>> GetAllUsersAsync()
        {
            string sql = "SELECT * FROM UserProfiles";
            return await _db.QueryAsync<UserProfile>(sql);
        }

        public async Task<IEnumerable<PasswordHistory>> GetPasswordHistoryAsync(int userId, int count)
        {
            string sql = "SELECT * FROM PasswordHistory WHERE Id = @Id";
            return await _db.QueryAsync<PasswordHistory>(sql, new { Id = userId });
        }

        public async Task AddPasswordHistoryAsync(PasswordHistory passwordHistory)
        {
            string sql = @"
                INSERT INTO PasswordHistory (UserProfileId, PasswordHash, CreatedAt) 
                VALUES (@UserProfileId, @PasswordHash, @CreatedAt) 
                RETURNING Id";
            passwordHistory.Id = await _db.ExecuteScalarAsync<int>(sql, passwordHistory);
        }

        public async Task<IEnumerable<UserProfile>> SearchUsersAsync(string term, int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(term) || term.Length < 3) return Enumerable.Empty<UserProfile>();
            var sql = @"SELECT * FROM UserProfiles WHERE LOWER(UserName) LIKE '%' || @Term || '%' OR LOWER(Email) LIKE '%' || @Term || '%' ORDER BY UserName LIMIT @Limit";
            return await _db.QueryAsync<UserProfile>(sql, new { Term = term.ToLower(), Limit = limit });
        }

        // ════════════════════════════════════════════════════════════
        //  PLAYERS (User Profile Players)
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreatePlayerAsync(UserProfilePlayer player)
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var sql = @"
                INSERT INTO UserProfilePlayers (Name, ProfileId, PreferredColors, FillPattern, IsPrimary, KaraokeSettings) 
                VALUES (@Name, @ProfileId, @PreferredColors, @FillPattern, @IsPrimary, @KaraokeSettings) 
                RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, new
            {
                player.Name,
                player.ProfileId,
                player.PreferredColors,
                player.FillPattern,
                player.IsPrimary,
                KaraokeSettings = JsonSerializer.Serialize(player.KaraokeSettings, jsonOptions)
            });
        }

        public async Task<UserProfilePlayer?> GetPlayerByIdAsync(int id)
        {
            var sql = "SELECT * FROM UserProfilePlayers WHERE Id = @Id";
            return await _db.QueryFirstOrDefaultAsync<UserProfilePlayer>(sql, new { Id = id });
        }

        public async Task<IEnumerable<UserProfilePlayer>> GetPlayersByUserAsync(int userId)
        {
            var sql = "SELECT * FROM UserProfilePlayers WHERE ProfileId = @UserId ORDER BY Name";
            return await _db.QueryAsync<UserProfilePlayer>(sql, new { UserId = userId });
        }

        public async Task<bool> UpdatePlayerAsync(UserProfilePlayer player)
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var sql = @"
                UPDATE UserProfilePlayers 
                SET Name = @Name, PreferredColors = @PreferredColors, FillPattern = @FillPattern, IsPrimary = @IsPrimary, KaraokeSettings = @KaraokeSettings 
                WHERE Id = @Id";
            var affected = await _db.ExecuteAsync(sql, new
            {
                player.Name,
                player.PreferredColors,
                player.FillPattern,
                player.IsPrimary,
                KaraokeSettings = JsonSerializer.Serialize(player.KaraokeSettings, jsonOptions),
                player.Id
            });
            return affected > 0;
        }

        public async Task<bool> DeletePlayerAsync(int id)
        {
            var sql = "DELETE FROM UserProfilePlayers WHERE Id = @Id";
            var affected = await _db.ExecuteAsync(sql, new { Id = id });
            return affected > 0;
        }

        public async Task<bool> SetPrimaryPlayerAsync(int userId, int playerId)
        {
            // First, set all players to non-primary
            var sql1 = "UPDATE UserProfilePlayers SET IsPrimary = false WHERE ProfileId = @UserId";
            await _db.ExecuteAsync(sql1, new { UserId = userId });
            
            // Then set the selected player as primary
            var sql2 = "UPDATE UserProfilePlayers SET IsPrimary = true WHERE Id = @PlayerId AND ProfileId = @UserId";
            var affected = await _db.ExecuteAsync(sql2, new { PlayerId = playerId, UserId = userId });
            return affected > 0;
        }

        // ════════════════════════════════════════════════════════════
        //  DEVICES (Dapper)
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreateDeviceAsync(UserProfileDevice device)
        {
            var sql = @"INSERT INTO UserDevices (UserId, DeviceId, DeviceName, UserDeviceName, DeviceType, Visible, CreatedAt) 
                        VALUES (@UserId, @DeviceId, @DeviceName, @UserDeviceName, @DeviceType, @Visible, @CreatedAt) 
                        RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, device);
        }

        public async Task<UserProfileDevice?> GetDeviceByIdAsync(int id)
        {
            return await _db.QueryFirstOrDefaultAsync<UserProfileDevice>(
                "SELECT * FROM UserDevices WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<UserProfileDevice>> GetDevicesByUserAsync(int userId)
        {
            return await _db.QueryAsync<UserProfileDevice>(
                "SELECT * FROM UserDevices WHERE UserId = @UserId ORDER BY DeviceName", new { UserId = userId });
        }

        public async Task<bool> UpdateDeviceAsync(UserProfileDevice device)
        {
            var sql = "UPDATE UserDevices SET DeviceName = @DeviceName, UserDeviceName = @UserDeviceName, Visible = @Visible WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, device) > 0;
        }

        public async Task<bool> DeleteDeviceAsync(int id)
        {
            return await _db.ExecuteAsync("DELETE FROM UserDevices WHERE Id = @Id", new { Id = id }) > 0;
        }

        // ════════════════════════════════════════════════════════════
        //  MICROPHONES (Dapper)
        // ════════════════════════════════════════════════════════════


        public async Task<int> CreateMicrophoneAsync(UserProfileMicrophone microphone)
        {
            var sql = @"INSERT INTO UserMicrophones (UserId, DeviceId, Volume, Threshold, Visible, CreatedAt, MicGain, MonitorEnabled, MonitorVolume, PitchThreshold) 
                        VALUES (@UserId, @DeviceId, @Volume, @Threshold, @Visible, @CreatedAt, @MicGain, @MonitorEnabled, @MonitorVolume, @PitchThreshold) 
                        RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, microphone);
        }

        public async Task<UserProfileMicrophone?> GetMicrophoneByIdAsync(int id)
        {
            return await _db.QueryFirstOrDefaultAsync<UserProfileMicrophone>(
                "SELECT * FROM UserMicrophones WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<UserProfileMicrophone>> GetMicrophonesByUserAsync(int userId)
        {
            return await _db.QueryAsync<UserProfileMicrophone>(
                "SELECT * FROM UserMicrophones WHERE UserId = @UserId ORDER BY DeviceId", new { UserId = userId });
        }

        public async Task<bool> UpdateMicrophoneAsync(UserProfileMicrophone microphone)
        {
            var sql = @"UPDATE UserMicrophones SET Volume = @Volume, Threshold = @Threshold, Visible = @Visible, 
                        MicGain = @MicGain, MonitorEnabled = @MonitorEnabled, MonitorVolume = @MonitorVolume, 
                        PitchThreshold = @PitchThreshold, UpdatedAt = @UpdatedAt WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, microphone) > 0;
        }

        public async Task<bool> DeleteMicrophoneAsync(int id)
        {
            return await _db.ExecuteAsync("DELETE FROM UserMicrophones WHERE Id = @Id", new { Id = id }) > 0;
        }

        // ════════════════════════════════════════════════════════════
        //  MICROPHONE ASSIGNMENTS (Dapper)
        // ════════════════════════════════════════════════════════════

        public async Task<int> CreateMicrophoneAssignmentAsync(MicrophoneAssignment assignment)
        {
            var sql = @"INSERT INTO MicrophoneAssignments (UserId, MicrophoneId, PlayerId, Slot) 
                        VALUES (@UserId, @MicrophoneId, @PlayerId, @Slot) RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, assignment);
        }

        public async Task<MicrophoneAssignment?> GetMicrophoneAssignmentByIdAsync(int id)
        {
            return await _db.QueryFirstOrDefaultAsync<MicrophoneAssignment>(
                "SELECT * FROM MicrophoneAssignments WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<MicrophoneAssignment>> GetMicrophoneAssignmentsByUserAsync(int userId)
        {
            return await _db.QueryAsync<MicrophoneAssignment>(
                "SELECT * FROM MicrophoneAssignments WHERE UserId = @UserId ORDER BY Slot", new { UserId = userId });
        }

        public async Task<IEnumerable<MicrophoneAssignment>> GetAllMicrophoneAssignmentsAsync()
        {
            return await _db.QueryAsync<MicrophoneAssignment>(
                "SELECT * FROM MicrophoneAssignments ORDER BY AssignedAt DESC");
        }

        public async Task<MicrophoneAssignment?> GetMicrophoneAssignmentBySlotAsync(int userId, int slot)
        {
            return await _db.QueryFirstOrDefaultAsync<MicrophoneAssignment>(
                "SELECT * FROM MicrophoneAssignments WHERE UserId = @UserId AND Slot = @Slot", 
                new { UserId = userId, Slot = slot });
        }

        public async Task<bool> UpdateMicrophoneAssignmentAsync(MicrophoneAssignment assignment)
        {
            var sql = "UPDATE MicrophoneAssignments SET MicrophoneId = @MicrophoneId, Color = @Color, Slot = @Slot, AssignedAt = @AssignedAt WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, assignment) > 0;
        }

        public async Task<bool> DeleteMicrophoneAssignmentAsync(int id)
        {
            return await _db.ExecuteAsync("DELETE FROM MicrophoneAssignments WHERE Id = @Id", new { Id = id }) > 0;
        }

        // ════════════════════════════════════════════════════════════
        //  USER SETTINGS (Dapper)
        // ════════════════════════════════════════════════════════════

        public async Task<bool> UpdateUserSettingsAsync(int userId, string? displayName, string? avatarUrl, string? preferredLanguage)
        {
            var updates = new List<string>();
            var parameters = new DynamicParameters();
            parameters.Add("UserId", userId);

            if (displayName != null) { updates.Add("FullName = @DisplayName"); parameters.Add("DisplayName", displayName); }
            // AvatarUrl and PreferredLanguage may not exist on UserProfile - skip

            if (updates.Count == 0) return false;

            var sql = $"UPDATE AspNetUsers SET {string.Join(", ", updates)} WHERE Id = @UserId";
            return await _db.ExecuteAsync(sql, parameters) > 0;
        }

        // ════════════════════════════════════════════════════════════
        //  USER PROFILE SETTINGS (Dapper)
        // ════════════════════════════════════════════════════════════

        public async Task<UserProfileSettings?> GetUserProfileSettingsAsync(int userId)
        {
            return await _db.QueryFirstOrDefaultAsync<UserProfileSettings>(
                "SELECT * FROM UserProfileSettings WHERE UserId = @UserId", new { UserId = userId });
        }

        public async Task<int> CreateUserProfileSettingsAsync(UserProfileSettings settings)
        {
            var sql = @"INSERT INTO UserProfileSettings 
                        (UserId, DeveloperMode, Jurors, Fullscreen, Theme, SoundEffects, Language,
                         Difficulty, PitchAlgorithm, CompletedTutorials, BreadcrumbsEnabled,
                         KaraokeDisplaySettings, PlayerKaraokeSettings, GamepadMapping, CustomThemes, LocalPlaylists) 
                        VALUES (@UserId, @DeveloperMode, @Jurors, @Fullscreen, @Theme, @SoundEffects, @Language,
                                @Difficulty, @PitchAlgorithm, @CompletedTutorials, @BreadcrumbsEnabled,
                                @KaraokeDisplaySettings, @PlayerKaraokeSettings, @GamepadMapping, @CustomThemes, @LocalPlaylists) 
                        RETURNING Id";
            return await _db.ExecuteScalarAsync<int>(sql, settings);
        }

        public async Task<bool> UpdateUserProfileSettingsAsync(UserProfileSettings settings)
        {
            var sql = @"UPDATE UserProfileSettings SET 
                        DeveloperMode = @DeveloperMode, Jurors = @Jurors, 
                        Fullscreen = @Fullscreen, Theme = @Theme, SoundEffects = @SoundEffects, Language = @Language,
                        Difficulty = @Difficulty, PitchAlgorithm = @PitchAlgorithm, 
                        CompletedTutorials = @CompletedTutorials, BreadcrumbsEnabled = @BreadcrumbsEnabled,
                        KaraokeDisplaySettings = @KaraokeDisplaySettings, PlayerKaraokeSettings = @PlayerKaraokeSettings,
                        GamepadMapping = @GamepadMapping, CustomThemes = @CustomThemes, LocalPlaylists = @LocalPlaylists
                        WHERE Id = @Id";
            return await _db.ExecuteAsync(sql, settings) > 0;
        }

        // ── Player Links (stubs — use UserProfileRepositoryEF) ──
        public Task<PlayerLink?> GetActivePlayerLinkAsync(int sourcePlayerId, int targetPlayerId, CancellationToken ct = default) => throw new NotImplementedException("Use UserProfileRepositoryEF");
        public Task<IEnumerable<PlayerLink>> GetPlayerLinksForProfileAsync(int profileId, CancellationToken ct = default) => throw new NotImplementedException("Use UserProfileRepositoryEF");
        public Task<int> AddPlayerLinkAsync(PlayerLink link, CancellationToken ct = default) => throw new NotImplementedException("Use UserProfileRepositoryEF");
        public Task<PlayerLink?> GetPlayerLinkByIdAsync(int id, CancellationToken ct = default) => throw new NotImplementedException("Use UserProfileRepositoryEF");
        public Task<bool> RevokePlayerLinkAsync(int linkId, int profileId, CancellationToken ct = default) => throw new NotImplementedException("Use UserProfileRepositoryEF");
    }
}
