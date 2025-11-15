using Dapper;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using System.Data;

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
    }
}
