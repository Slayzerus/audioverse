using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Handlers.User;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Handlers
{
    public class MicrophoneHandlersTests
    {
        [Fact]
        public async Task CreateMicrophone_CallsRepository()
        {
            var mockRepo = new Mock<IUserProfileRepository>();
            mockRepo.Setup(r => r.CreateMicrophoneAsync(It.IsAny<UserProfileMicrophone>()))
                .ReturnsAsync(42);

            var handler = new CreateMicrophoneHandler(mockRepo.Object);
            var id = await handler.Handle(
                new CreateMicrophoneCommand(1, "mic-1", 90, 5, true, 12, false, 100, 0.5, 5, 3, 0.01, true, AudioVerse.Domain.Enums.PitchDetectionMethod.UltrastarWP, 0), 
                default);

            Assert.Equal(42, id);
            mockRepo.Verify(r => r.CreateMicrophoneAsync(It.Is<UserProfileMicrophone>(m => 
                m.DeviceId == "mic-1" && 
                m.Volume == 90)), Times.Once);
        }

        [Fact]
        public async Task DeleteMicrophone_CallsRepository()
        {
            var mockRepo = new Mock<IUserProfileRepository>();
            mockRepo.Setup(r => r.GetMicrophoneByIdAsync(1))
                .ReturnsAsync(new UserProfileMicrophone { Id = 1, UserId = 1 });
            mockRepo.Setup(r => r.DeleteMicrophoneAsync(1)).ReturnsAsync(true);

            var handler = new DeleteMicrophoneHandler(mockRepo.Object);
            var result = await handler.Handle(new DeleteMicrophoneCommand(1, 1), default);

            Assert.True(result);
            mockRepo.Verify(r => r.DeleteMicrophoneAsync(1), Times.Once);
        }
    }
}
