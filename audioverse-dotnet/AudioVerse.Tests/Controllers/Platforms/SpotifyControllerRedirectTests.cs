using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AudioVerse.API.Areas.Platforms.Controllers;
using AudioVerse.API.Models.Requests.Platforms;
using AudioVerse.Application.Services.Platforms.Spotify;
using AudioVerse.Application.Models.Platforms.Spotify;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Application.Services;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Controllers.Platforms
{
    public class SpotifyControllerRedirectTests
    {
        [Fact]
        public async Task Link_Redirects_When_ReturnToAllowedAbsolute()
        {
            var mockSpotify = new Mock<ISpotifyService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<SpotifyController>>();

            mockUser.SetupGet(u => u.UserId).Returns(7);

            var tokens = new SpotifyAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockSpotify.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockSpotify.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Spotify.UserProfile { Id = "u1", DisplayName = "U1" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(123);

            var inMem = new Dictionary<string, string?>
            {
                ["Frontend:AllowedOrigins:0"] = "https://app.example.com"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMem).Build();

            var opts = Options.Create(new SpotifyServiceOptions());
            var controller = new SpotifyController(mockSpotify.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new SpotifyLinkRequest("code-xyz", "https://app.example.com/callback");
            var returnTo = "https://app.example.com/callback";

            var result = await controller.Link(req, returnTo);

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("https://app.example.com/callback?platform=spotify&linked=true&id=123", redirect.Url);
        }

        [Fact]
        public async Task Link_Redirects_When_ReturnToRelative()
        {
            var mockSpotify = new Mock<ISpotifyService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<SpotifyController>>();

            mockUser.SetupGet(u => u.UserId).Returns(8);
            var tokens = new SpotifyAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockSpotify.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockSpotify.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Spotify.UserProfile { Id = "u2", DisplayName = "U2" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(555);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
            var opts = Options.Create(new SpotifyServiceOptions());
            var controller = new SpotifyController(mockSpotify.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new SpotifyLinkRequest("code-xyz", "https://app.example.com/callback");
            var returnTo = "/profile/connections";

            var result = await controller.Link(req, returnTo);

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("/profile/connections?platform=spotify&linked=true&id=555", redirect.Url);
        }

        [Fact]
        public async Task Link_ReturnsOk_When_ReturnToNotAllowedAbsolute()
        {
            var mockSpotify = new Mock<ISpotifyService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<SpotifyController>>();

            mockUser.SetupGet(u => u.UserId).Returns(9);
            var tokens = new SpotifyAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockSpotify.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockSpotify.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Spotify.UserProfile { Id = "u3", DisplayName = "U3" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(777);

            var inMem = new Dictionary<string, string?>
            {
                ["Frontend:AllowedOrigins:0"] = "https://other.example.com"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMem).Build();
            var opts = Options.Create(new SpotifyServiceOptions());
            var controller = new SpotifyController(mockSpotify.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new SpotifyLinkRequest("code-xyz", "https://app.example.com/callback");
            var returnTo = "https://notallowed.example.com/redirect";

            var result = await controller.Link(req, returnTo);

            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value);
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.GetProperty("linked").GetBoolean());
            Assert.Equal(777, doc.RootElement.GetProperty("id").GetInt32());
        }
    }
}
