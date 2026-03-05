using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Handlers.User;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Handlers
{
    public class DeviceHandlersTests
    {
        [Fact]
        public async Task CreateDevice_CallsRepository()
        {
            var mockRepo = new Mock<IUserProfileRepository>();
            mockRepo.Setup(r => r.CreateDeviceAsync(It.IsAny<UserProfileDevice>()))
                .ReturnsAsync(42);

            var handler = new CreateDeviceHandler(mockRepo.Object);
            var id = await handler.Handle(
                new CreateDeviceCommand(1, "dev-1", "Keyboard Device", "My Keyboard", DeviceType.Keyboard, true), 
                default);

            Assert.Equal(42, id);
            mockRepo.Verify(r => r.CreateDeviceAsync(It.Is<UserProfileDevice>(d => 
                d.DeviceId == "dev-1" && 
                d.DeviceType == DeviceType.Keyboard)), Times.Once);
        }
    }
}
