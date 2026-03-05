using System.Net;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AudioVerse.Tests.Services
{
    public class LoginAttemptServiceTests
    {
        private AudioVerseDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AudioVerseDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            return new AudioVerseDbContext(options);
        }

        private LoginAttemptService CreateService(AudioVerseDbContext dbContext, string? ip = "127.0.0.1")
        {
            var httpContext = new DefaultHttpContext();
            if (!string.IsNullOrEmpty(ip))
            {
                httpContext.Connection.RemoteIpAddress = IPAddress.Parse(ip);
            }
            var accessor = new HttpContextAccessor { HttpContext = httpContext };
            var securityRepo = new UserSecurityRepositoryEF(dbContext, NullLogger<UserSecurityRepositoryEF>.Instance);
            return new LoginAttemptService(securityRepo, accessor);
        }

        [Fact]
        public async Task RecordLoginAttempt_SavesAttemptWithIp()
        {
            using var db = CreateDbContext();
            var service = CreateService(db, "192.168.0.10");

            await service.RecordLoginAttemptAsync(1, "user", success: false);

            var attempt = db.LoginAttempts.Single();
            Assert.Equal(1, attempt.UserId);
            Assert.Equal("user", attempt.Username);
            Assert.False(attempt.Success);
            Assert.Equal("192.168.0.10", attempt.IpAddress);
        }

        [Fact]
        public async Task IsUserBlocked_ReturnsTrueAfterThreeRecentFails()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var now = DateTime.UtcNow;

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-1) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-2) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-3) }
            );
            db.SaveChanges();

            var (isBlocked, remaining) = await service.IsUserBlockedAsync(1);

            Assert.True(isBlocked);
            Assert.True(remaining.TotalMinutes <= 15 && remaining.TotalMinutes > 0);
        }

        [Fact]
        public async Task IsUserBlocked_IgnoresOldFailures()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var now = DateTime.UtcNow;

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-20) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-25) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-1) },
                new LoginAttempt { UserId = 1, Username = "u", Success = true, AttemptTime = now.AddMinutes(-2) }
            );
            db.SaveChanges();

            var (isBlocked, remaining) = await service.IsUserBlockedAsync(1);

            Assert.False(isBlocked);
            Assert.Equal(TimeSpan.Zero, remaining);
        }

        [Fact]
        public async Task UnblockUser_RemovesAttempts()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = false },
                new LoginAttempt { UserId = 1, Username = "u", Success = true }
            );
            db.SaveChanges();

            await service.UnblockUserAsync(1);

            Assert.Empty(db.LoginAttempts);
        }

        [Fact]
        public async Task GetRecentFailedAttempts_FiltersByMinutes()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var now = DateTime.UtcNow;

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-5) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-20) },
                new LoginAttempt { UserId = 1, Username = "u", Success = true, AttemptTime = now.AddMinutes(-1) }
            );
            db.SaveChanges();

            var recent = await service.GetRecentFailedAttemptsAsync(10);

            Assert.Single(recent);
            Assert.Equal(now.AddMinutes(-5).Minute, recent[0].AttemptTime.Minute);
        }

        [Fact]
        public async Task GetUserLoginAttempts_ReturnsDescending()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var now = DateTime.UtcNow;

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = true, AttemptTime = now.AddMinutes(-10) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now.AddMinutes(-1) },
                new LoginAttempt { UserId = 2, Username = "v", Success = false, AttemptTime = now }
            );
            db.SaveChanges();

            var attempts = await service.GetUserLoginAttemptsAsync(1);

            Assert.Equal(2, attempts.Count);
            Assert.True(attempts[0].AttemptTime > attempts[1].AttemptTime);
        }

        [Fact]
        public async Task GetAllLoginAttempts_ReturnsDescending()
        {
            using var db = CreateDbContext();
            var service = CreateService(db);
            var now = DateTime.UtcNow;

            db.LoginAttempts.AddRange(
                new LoginAttempt { UserId = 1, Username = "u", Success = true, AttemptTime = now.AddMinutes(-1) },
                new LoginAttempt { UserId = 1, Username = "u", Success = false, AttemptTime = now }
            );
            db.SaveChanges();

            var attempts = await service.GetAllLoginAttemptsAsync();

            Assert.Equal(2, attempts.Count);
            Assert.True(attempts[0].AttemptTime > attempts[1].AttemptTime);
        }
    }
}
