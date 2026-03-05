using AudioVerse.Application.Models;
using AudioVerse.Application.Services.Security;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AudioVerse.Tests.Services
{
    public class OtpServiceTests
    {
        private AudioVerseDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AudioVerseDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AudioVerseDbContext(options);
        }

        private OtpService CreateService(AudioVerseDbContext dbContext)
        {
            var passwordHasher = new PasswordHasher<UserProfile>();
            var customHasher = new CustomHashService();
            var securityRepo = new UserSecurityRepositoryEF(dbContext, NullLogger<UserSecurityRepositoryEF>.Instance);
            var userRepo = new UserProfileRepositoryEF(dbContext);
            return new OtpService(securityRepo, userRepo, passwordHasher, customHasher);
        }

        private UserProfile SeedUser(AudioVerseDbContext db, int id = 1, string username = "john", string email = "john@test.com")
        {
            var user = new UserProfile
            {
                Id = id,
                UserName = username,
                Email = email
            };
            db.Users.Add(user);
            db.SaveChanges();
            return user;
        }

        [Fact]
        public async Task GenerateOtpAsync_ByUserId_CreatesHashedOtpAndRemovesOld()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            SeedUser(db);

            // Existing OTP to be removed
            db.OneTimePasswords.Add(new OneTimePassword
            {
                UserId = 1,
                PasswordHash = "old",
                CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            });
            db.SaveChanges();

            var result = await service.GenerateOtpAsync(1);

            Assert.NotNull(result);
            Assert.InRange(result.Otp.Length, 6, 12);
            Assert.All(result.Otp, c => Assert.True(char.IsDigit(c)));

            var stored = db.OneTimePasswords.Single(o => !o.IsUsed);
            Assert.Equal(1, stored.UserId);
            Assert.NotEqual(result.Otp, stored.PasswordHash); // should be hashed
            Assert.False(stored.IsUsed);
        }

        [Fact]
        public async Task ValidateOtpAsync_ReturnsTrueAndMarksUsed()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var user = SeedUser(db);

            var otp = await service.GenerateOtpAsync(user);
            var valid = await service.ValidateOtpAsync(user, otp);

            Assert.True(valid);
            var record = db.OneTimePasswords.Single();
            Assert.True(record.IsUsed);
            Assert.NotNull(record.UsedAt);

            // second attempt should fail
            var second = await service.ValidateOtpAsync(user, otp);
            Assert.False(second);
        }

        [Fact]
        public async Task ValidateOtpAsync_ReturnsFalseWhenExpired()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var user = SeedUser(db);

            db.OneTimePasswords.Add(new OneTimePassword
            {
                UserId = user.Id,
                PasswordHash = new CustomHashService().HashPassword(user.UserName!, "123456"),
                CreatedAt = DateTime.UtcNow.AddMinutes(-20),
                ExpiresAt = DateTime.UtcNow.AddMinutes(-5),
                IsUsed = false
            });
            db.SaveChanges();

            var valid = await service.ValidateOtpAsync(user, "123456");
            Assert.False(valid);
        }
    }
}
