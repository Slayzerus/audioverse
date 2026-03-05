using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AudioVerse.API.Areas.Platforms.Controllers;
using AudioVerse.API.Models.Requests.Platforms;
using AudioVerse.Application.Services.Platforms;
using AudioVerse.Application.Models.Platforms.YouTube;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Application.Services;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace AudioVerse.Tests.Controllers.Platforms
{
    public class YouTubeControllerTests
    {
        private static YouTubeController CreateController(
            Mock<IYouTubeService>? mockYt = null,
            Mock<IExternalAccountRepository>? mockRepo = null,
            Mock<ICurrentUserService>? mockUser = null,
            Mock<IHttpClientFactory>? mockFactory = null,
            IConfiguration? config = null)
        {
            mockYt ??= new Mock<IYouTubeService>();
            mockRepo ??= new Mock<IExternalAccountRepository>();
            mockUser ??= new Mock<ICurrentUserService>();
            mockFactory ??= new Mock<IHttpClientFactory>();
            config ??= new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
            var mockLogger = new Mock<ILogger<YouTubeController>>();
            var opts = Options.Create(new YouTubeServiceOptions());
            return new YouTubeController(mockYt.Object, mockRepo.Object, mockUser.Object, opts, mockFactory.Object, mockLogger.Object, config);
        }

        // ==================== AUTH-URL ====================

        [Fact]
        public void GetAuthUrl_ReturnsBadRequest_WhenRedirectUriMissing()
        {
            var controller = CreateController();
            var result = controller.GetAuthUrl(null);
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public void GetAuthUrl_ReturnsOk_WithUrlAndState()
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["YouTube:ClientId"] = "test-client-id"
            }).Build();
            var controller = CreateController(config: config);

            var result = controller.GetAuthUrl("https://example.com/callback");
            var ok = Assert.IsType<OkObjectResult>(result);

            var json = JsonSerializer.Serialize(ok.Value);
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.TryGetProperty("url", out var urlProp));
            Assert.True(doc.RootElement.TryGetProperty("state", out _));

            var url = urlProp.GetString()!;
            Assert.Contains("accounts.google.com", url);
            Assert.Contains("test-client-id", url);
            Assert.Contains("offline", url);
        }

        // ==================== LINK ====================

        [Fact]
        public async Task Link_ReturnsBadRequest_WhenCodeMissing()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var controller = CreateController(mockUser: mockUser);

            var req = new YouTubeLinkRequest("", "https://example.com/cb");
            var result = await controller.Link(req, null);
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Link_ReturnsForbid_WhenNoUserId()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns((int?)null);
            var controller = CreateController(mockUser: mockUser);

            var req = new YouTubeLinkRequest("code", "https://example.com/cb");
            var result = await controller.Link(req, null);
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Link_ReturnsOk_OnSuccess()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(5);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(99);

            // Mock HttpClient for token exchange (success) and userinfo (success)
            var tokenResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new
                {
                    access_token = "yt-access",
                    refresh_token = "yt-refresh",
                    expires_in = 3600,
                    token_type = "Bearer",
                    scope = "openid email"
                }))
            };
            var userinfoResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new
                {
                    sub = "google-123",
                    name = "Test User",
                    email = "test@example.com",
                    picture = "https://example.com/pic.jpg"
                }))
            };

            var handlerMock = new Mock<HttpMessageHandler>();
            var callCount = 0;
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() =>
                {
                    callCount++;
                    return callCount == 1 ? tokenResponse : userinfoResponse;
                });

            var httpClient = new HttpClient(handlerMock.Object);
            var mockFactory = new Mock<IHttpClientFactory>();
            mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["YouTube:ClientId"] = "cid",
                ["YouTube:ClientSecret"] = "csecret"
            }).Build();

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser, mockFactory: mockFactory, config: config);

            var req = new YouTubeLinkRequest("auth-code", "https://example.com/cb");
            var result = await controller.Link(req, null);

            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value);
            using var doc = JsonDocument.Parse(json);
            Assert.True(doc.RootElement.GetProperty("linked").GetBoolean());
            Assert.Equal(99, doc.RootElement.GetProperty("id").GetInt32());
        }

        [Fact]
        public async Task Link_Redirects_WhenReturnToAllowed()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(5);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(42);

            var tokenResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { access_token = "a", refresh_token = "r", expires_in = 3600, token_type = "Bearer" }))
            };
            var userinfoResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { sub = "g1", name = "U" }))
            };
            var callCount = 0;
            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() => { callCount++; return callCount == 1 ? tokenResponse : userinfoResponse; });

            var httpClient = new HttpClient(handlerMock.Object);
            var mockFactory = new Mock<IHttpClientFactory>();
            mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["YouTube:ClientId"] = "cid",
                ["YouTube:ClientSecret"] = "csecret",
                ["Frontend:AllowedOrigins:0"] = "https://myapp.example.com"
            }).Build();

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser, mockFactory: mockFactory, config: config);

            var req = new YouTubeLinkRequest("code", "https://myapp.example.com/cb");
            var result = await controller.Link(req, "https://myapp.example.com/profile");

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("https://myapp.example.com/profile?platform=youtube&linked=true&id=42", redirect.Url);
        }

        [Fact]
        public async Task Link_ReturnsOk_WhenReturnToDisallowed()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(5);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(42);

            var tokenResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { access_token = "a", refresh_token = "r", expires_in = 3600, token_type = "Bearer" }))
            };
            var userinfoResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { sub = "g1", name = "U" }))
            };
            var callCount = 0;
            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() => { callCount++; return callCount == 1 ? tokenResponse : userinfoResponse; });

            var httpClient = new HttpClient(handlerMock.Object);
            var mockFactory = new Mock<IHttpClientFactory>();
            mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["YouTube:ClientId"] = "cid",
                ["YouTube:ClientSecret"] = "csecret",
                ["Frontend:AllowedOrigins:0"] = "https://allowed.example.com"
            }).Build();

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser, mockFactory: mockFactory, config: config);

            var req = new YouTubeLinkRequest("code", "https://evil.example.com/cb");
            var result = await controller.Link(req, "https://evil.example.com/steal");

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task Link_Redirects_WhenReturnToRelative()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(5);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.LinkAccountAsync(It.IsAny<UserExternalAccount>())).ReturnsAsync(77);

            var tokenResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { access_token = "a", refresh_token = "r", expires_in = 3600, token_type = "Bearer" }))
            };
            var userinfoResponse = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { sub = "g1" }))
            };
            var callCount = 0;
            var handlerMock = new Mock<HttpMessageHandler>();
            handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(() => { callCount++; return callCount == 1 ? tokenResponse : userinfoResponse; });

            var httpClient = new HttpClient(handlerMock.Object);
            var mockFactory = new Mock<IHttpClientFactory>();
            mockFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(httpClient);

            var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["YouTube:ClientId"] = "cid",
                ["YouTube:ClientSecret"] = "csecret"
            }).Build();

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser, mockFactory: mockFactory, config: config);

            var req = new YouTubeLinkRequest("code", "https://x.com/cb");
            var result = await controller.Link(req, "/settings/accounts");

            var redirect = Assert.IsType<RedirectResult>(result);
            Assert.Equal("/settings/accounts?platform=youtube&linked=true&id=77", redirect.Url);
        }

        // ==================== REFRESH ====================

        [Fact]
        public async Task Refresh_ReturnsNotFound_WhenNotLinked()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube)).ReturnsAsync((UserExternalAccount?)null);

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.Refresh();
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task Refresh_ReturnsBadRequest_WhenNoRefreshToken()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube))
                .ReturnsAsync(new UserExternalAccount { Id = 10, RefreshToken = null });

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.Refresh();
            Assert.IsType<BadRequestObjectResult>(result);
        }

        // ==================== CREATE PLAYLIST ====================

        [Fact]
        public async Task CreatePlaylist_ReturnsNotFound_WhenNotLinked()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube)).ReturnsAsync((UserExternalAccount?)null);

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.CreatePlaylist(new CreateYouTubePlaylistRequest("Test", null, null));
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task CreatePlaylist_ReturnsOk_OnSuccess()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube))
                .ReturnsAsync(new UserExternalAccount { Id = 10, AccessToken = "tok" });
            var mockYt = new Mock<IYouTubeService>();
            mockYt.Setup(y => y.CreatePlaylistAsync("MyPL", null, "private", default))
                .ReturnsAsync(new Playlist { Id = "pl-1" });

            var controller = CreateController(mockYt: mockYt, mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.CreatePlaylist(new CreateYouTubePlaylistRequest("MyPL", null, null));
            Assert.IsType<OkObjectResult>(result);
        }

        // ==================== SUBSCRIBE ====================

        [Fact]
        public async Task Subscribe_ReturnsNotFound_WhenNotLinked()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube)).ReturnsAsync((UserExternalAccount?)null);

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.Subscribe(new YouTubeSubscribeRequest("UC123"));
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task Subscribe_ReturnsOk_OnSuccess()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube))
                .ReturnsAsync(new UserExternalAccount { Id = 10, AccessToken = "tok" });
            var mockYt = new Mock<IYouTubeService>();

            var controller = CreateController(mockYt: mockYt, mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.Subscribe(new YouTubeSubscribeRequest("UC123"));
            var ok = Assert.IsType<OkObjectResult>(result);
            mockYt.Verify(y => y.SubscribeAsync("UC123", default), Times.Once);
        }

        // ==================== UNSUBSCRIBE ====================

        [Fact]
        public async Task Unsubscribe_ReturnsNoContent_OnSuccess()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube))
                .ReturnsAsync(new UserExternalAccount { Id = 10, AccessToken = "tok" });
            var mockYt = new Mock<IYouTubeService>();

            var controller = CreateController(mockYt: mockYt, mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.Unsubscribe("sub-id-1");
            Assert.IsType<NoContentResult>(result);
            mockYt.Verify(y => y.UnsubscribeAsync("sub-id-1", default), Times.Once);
        }

        // ==================== REMOVE PLAYLIST ITEM ====================

        [Fact]
        public async Task RemovePlaylistItem_ReturnsNoContent_OnSuccess()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube))
                .ReturnsAsync(new UserExternalAccount { Id = 10, AccessToken = "tok" });
            var mockYt = new Mock<IYouTubeService>();

            var controller = CreateController(mockYt: mockYt, mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.RemovePlaylistItem("pl-1", "item-1");
            Assert.IsType<NoContentResult>(result);
            mockYt.Verify(y => y.RemovePlaylistItemAsync("item-1", default), Times.Once);
        }

        // ==================== GET MY PLAYLISTS ====================

        [Fact]
        public async Task GetMyPlaylists_ReturnsNotFound_WhenNotLinked()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns(1);
            var mockRepo = new Mock<IExternalAccountRepository>();
            mockRepo.Setup(r => r.GetByPlatformAsync(1, ExternalPlatform.YouTube)).ReturnsAsync((UserExternalAccount?)null);

            var controller = CreateController(mockRepo: mockRepo, mockUser: mockUser);
            var result = await controller.GetMyPlaylists();
            Assert.IsType<NotFoundObjectResult>(result);
        }

        // ==================== FORBID WHEN NO USER ====================

        [Fact]
        public async Task Subscribe_ReturnsForbid_WhenNoUserId()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns((int?)null);
            var controller = CreateController(mockUser: mockUser);
            var result = await controller.Subscribe(new YouTubeSubscribeRequest("UC1"));
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CreatePlaylist_ReturnsForbid_WhenNoUserId()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns((int?)null);
            var controller = CreateController(mockUser: mockUser);
            var result = await controller.CreatePlaylist(new CreateYouTubePlaylistRequest("T", null, null));
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task Refresh_ReturnsForbid_WhenNoUserId()
        {
            var mockUser = new Mock<ICurrentUserService>();
            mockUser.SetupGet(u => u.UserId).Returns((int?)null);
            var controller = CreateController(mockUser: mockUser);
            var result = await controller.Refresh();
            Assert.IsType<ForbidResult>(result);
        }
    }
}
