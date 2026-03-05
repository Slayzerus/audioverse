using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Handlers.Admin;
using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Handlers
{
    public class SystemConfigurationHandlersTests
    {
        [Fact]
        public async Task UpdateSystemConfiguration_CallsCreateConfigAsync()
        {
            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.CreateConfigAsync(It.IsAny<SystemConfiguration>()))
                .ReturnsAsync(1);

            var handler = new UpdateSystemConfigurationHandler(mockRepo.Object);
            var cmd = new UpdateSystemConfigurationCommand(45, Domain.Enums.CaptchaOption.Type2, 6, 99, "admin", true);

            var result = await handler.Handle(cmd, default);

            Assert.True(result);
            mockRepo.Verify(r => r.CreateConfigAsync(It.Is<SystemConfiguration>(c => 
                c.SessionTimeoutMinutes == 45 && 
                c.MaxMicrophonePlayers == 6 &&
                c.ModifiedByUsername == "admin")), Times.Once);
        }

        [Fact]
        public async Task GetSystemConfiguration_ReturnsActiveConfig()
        {
            var activeConfig = new SystemConfiguration
            {
                Id = 2,
                SessionTimeoutMinutes = 30,
                CaptchaOption = Domain.Enums.CaptchaOption.Type2,
                Active = true,
                ModifiedAt = DateTime.UtcNow,
                MaxMicrophonePlayers = 5
            };

            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.GetActiveConfigAsync()).ReturnsAsync(activeConfig);

            var handler = new GetSystemConfigurationHandler(mockRepo.Object);
            var dto = await handler.Handle(new GetSystemConfigurationQuery(), default);

            Assert.Equal(2, dto.Id);
            Assert.Equal(30, dto.SessionTimeoutMinutes);
            Assert.Equal(5, dto.MaxMicrophonePlayers);
        }

        [Fact]
        public async Task GetSystemConfiguration_ThrowsWhenNoConfig()
        {
            var mockRepo = new Mock<ISystemConfigRepository>();
            mockRepo.Setup(r => r.GetActiveConfigAsync()).ReturnsAsync((SystemConfiguration?)null);

            var handler = new GetSystemConfigurationHandler(mockRepo.Object);

            await Assert.ThrowsAsync<Exception>(() => handler.Handle(new GetSystemConfigurationQuery(), default));
        }
    }
}
