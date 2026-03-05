using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AudioVerse.API.Areas.Platforms.Controllers;
using AudioVerse.API.Models.Requests.Platforms;
using AudioVerse.Application.Services.Platforms.Tidal;
using AudioVerse.Application.Models.Platforms.Tidal;
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
    public class TidalControllerRedirectTests
    {
        [Fact]
        public async Task Link_Redirects_When_ReturnToAllowedAbsolute()
        {
            var mockTidal = new Mock<ITidalService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<TidalController>>();

            mockUser.SetupGet(u => u.UserId).Returns(10);

            var tokens = new TidalAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockTidal.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockTidal.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Tidal.UserProfile { Id = "t1", Username = "T1" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(222);

            var inMem = new Dictionary<string, string?>
            {
                ["Frontend:AllowedOrigins:0"] = "https://tidal-app.example.com"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMem).Build();

            var opts = Options.Create(new TidalServiceOptions());
            var controller = new TidalController(mockTidal.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new TidalLinkRequest("code-xyz", "https://tidal-app.example.com/callback");
            var returnTo = "https://tidal-app.example.com/callback";

            var result = await controller.Link(req, returnTo);

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("https://tidal-app.example.com/callback?platform=tidal&linked=true&id=222", redirect.Url);
        }

        [Fact]
        public async Task Link_Redirects_When_ReturnToRelative()
        {
            var mockTidal = new Mock<ITidalService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<TidalController>>();

            mockUser.SetupGet(u => u.UserId).Returns(11);
            var tokens = new TidalAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockTidal.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockTidal.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Tidal.UserProfile { Id = "t2", Username = "T2" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(333);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
            var opts = Options.Create(new TidalServiceOptions());
            var controller = new TidalController(mockTidal.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new TidalLinkRequest("code-xyz", "https://tidal-app.example.com/callback");
            var returnTo = "/profile/connections";

            var result = await controller.Link(req, returnTo);

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("/profile/connections?platform=tidal&linked=true&id=333", redirect.Url);
        }

        [Fact]
        public async Task Link_ReturnsOk_When_ReturnToNotAllowedAbsolute()
        {
            var mockTidal = new Mock<ITidalService>();
            var mockRepo = new Mock<IExternalAccountRepository>();
            var mockUser = new Mock<ICurrentUserService>();
            var mockFactory = new Mock<System.Net.Http.IHttpClientFactory>();
            var mockLogger = new Mock<ILogger<TidalController>>();

            mockUser.SetupGet(u => u.UserId).Returns(12);
            var tokens = new TidalAuthTokens { AccessToken = "a", RefreshToken = "r", ExpiresInSeconds = 3600, ExpiresAt = DateTimeOffset.UtcNow.AddHours(1) };
            mockTidal.Setup(s => s.AuthenticateWithAuthCodeAsync(It.IsAny<string>(), It.IsAny<string>(), default)).ReturnsAsync(tokens);
            mockTidal.Setup(s => s.GetCurrentUserAsync(default)).ReturnsAsync(new AudioVerse.Application.Models.Platforms.Tidal.UserProfile { Id = "t3", Username = "T3" });
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(444);

            var inMem = new Dictionary<string, string?>
            {
                ["Frontend:AllowedOrigins:0"] = "https://other.example.com"
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(inMem).Build();
            var opts = Options.Create(new TidalServiceOptions());
            var controller = new TidalController(mockTidal.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);

            var req = new TidalLinkRequest("code-xyz", "https://tidal-app.example.com/callback");
            var returnTo = "https://notallowed.example.com/redirect";

            var result = await controller.Link(req, returnTo);

            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value);
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.GetProperty("linked").GetBoolean());
            Assert.Equal(444, doc.RootElement.GetProperty("id").GetInt32());
        }
    }
}
