using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Handlers.User;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Handlers
{
    public class MicrophoneAssignmentHandlersTests
    {
        [Fact]
        public async Task CreateAssignment_RespectsMaxSlots()
        {
            var mockUserRepo = new Mock<IUserProfileRepository>();
            var mockConfigRepo = new Mock<ISystemConfigRepository>();
            mockConfigRepo.Setup(r => r.GetActiveConfigAsync())
                .ReturnsAsync(new SystemConfiguration { MaxMicrophonePlayers = 2, Active = true });

            var handler = new CreateMicrophoneAssignmentHandler(mockUserRepo.Object, mockConfigRepo.Object);

            await Assert.ThrowsAsync<Exception>(() => handler.Handle(
                new CreateMicrophoneAssignmentCommand(1, "mic1", "#FF0000", 3), default));
        }

        [Fact]
        public async Task CreateAssignment_SucceedsWithinRange()
        {
            var mockUserRepo = new Mock<IUserProfileRepository>();
            var mockConfigRepo = new Mock<ISystemConfigRepository>();
            mockConfigRepo.Setup(r => r.GetActiveConfigAsync())
                .ReturnsAsync(new SystemConfiguration { MaxMicrophonePlayers = 4, Active = true });
            mockUserRepo.Setup(r => r.CreateMicrophoneAssignmentAsync(It.IsAny<MicrophoneAssignment>()))
                .ReturnsAsync(42);

            var handler = new CreateMicrophoneAssignmentHandler(mockUserRepo.Object, mockConfigRepo.Object);
            var id = await handler.Handle(new CreateMicrophoneAssignmentCommand(1, "mic1", "#00FF00", 1), default);

            Assert.Equal(42, id);
            mockUserRepo.Verify(r => r.CreateMicrophoneAssignmentAsync(It.Is<MicrophoneAssignment>(a =>
                a.MicrophoneId == "mic1" && a.Color == "#00FF00" && a.Slot == 1)), Times.Once);
        }

        [Fact]
        public async Task UpdateAssignment_RespectsMaxSlots()
        {
            var mockUserRepo = new Mock<IUserProfileRepository>();
            var mockConfigRepo = new Mock<ISystemConfigRepository>();
            mockConfigRepo.Setup(r => r.GetActiveConfigAsync())
                .ReturnsAsync(new SystemConfiguration { MaxMicrophonePlayers = 3, Active = true });
            mockUserRepo.Setup(r => r.GetMicrophoneAssignmentByIdAsync(5))
                .ReturnsAsync(new MicrophoneAssignment { Id = 5, UserId = 1, Slot = 0 });

            var handler = new UpdateMicrophoneAssignmentHandler(mockUserRepo.Object, mockConfigRepo.Object);

            await Assert.ThrowsAsync<Exception>(() => handler.Handle(
                new UpdateMicrophoneAssignmentCommand(5, 1, "#222222", 5), default));
        }

        [Fact]
        public async Task UpdateAssignment_SucceedsWithinRange()
        {
            var mockUserRepo = new Mock<IUserProfileRepository>();
            var mockConfigRepo = new Mock<ISystemConfigRepository>();
            mockConfigRepo.Setup(r => r.GetActiveConfigAsync())
                .ReturnsAsync(new SystemConfiguration { MaxMicrophonePlayers = 3, Active = true });
            mockUserRepo.Setup(r => r.GetMicrophoneAssignmentByIdAsync(5))
                .ReturnsAsync(new MicrophoneAssignment { Id = 5, UserId = 1, Slot = 0 });
            mockUserRepo.Setup(r => r.UpdateMicrophoneAssignmentAsync(It.IsAny<MicrophoneAssignment>()))
                .ReturnsAsync(true);

            var handler = new UpdateMicrophoneAssignmentHandler(mockUserRepo.Object, mockConfigRepo.Object);
            var ok = await handler.Handle(new UpdateMicrophoneAssignmentCommand(5, 1, "#333333", 2), default);

            Assert.True(ok);
            mockUserRepo.Verify(r => r.UpdateMicrophoneAssignmentAsync(It.Is<MicrophoneAssignment>(a =>
                a.Color == "#333333" && a.Slot == 2)), Times.Once);
        }

        [Fact]
        public async Task DeleteAssignment_CallsRepository()
        {
            var mockUserRepo = new Mock<IUserProfileRepository>();
            mockUserRepo.Setup(r => r.GetMicrophoneAssignmentByIdAsync(7))
                .ReturnsAsync(new MicrophoneAssignment { Id = 7, UserId = 1 });
            mockUserRepo.Setup(r => r.DeleteMicrophoneAssignmentAsync(7)).ReturnsAsync(true);

            var handler = new DeleteMicrophoneAssignmentHandler(mockUserRepo.Object);
            var ok = await handler.Handle(new DeleteMicrophoneAssignmentCommand(7, 1), default);

            Assert.True(ok);
            mockUserRepo.Verify(r => r.DeleteMicrophoneAssignmentAsync(7), Times.Once);
        }
    }
}
