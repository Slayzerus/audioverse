using Xunit;
using Moq;
using AudioVerse.Application.Commands.Radio;
using AudioVerse.Application.Queries.Radio;
using AudioVerse.Application.Handlers.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class RadioHandlerTests
    {
        private readonly Mock<IRadioRepository> _repo = new();

        [Fact]
        public async Task GetRadioInvites_ReturnsMappedDtos()
        {
            var invites = new List<RadioStationInvite>
            {
                new()
                {
                    Id = 1, Email = "a@test.com", GuestName = "Guest A",
                    ValidFrom = DateTime.UtcNow, ValidTo = DateTime.UtcNow.AddHours(2),
                    Status = RadioInviteStatus.Pending, CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = 2, Email = "b@test.com", GuestName = null,
                    ValidFrom = DateTime.UtcNow, ValidTo = DateTime.UtcNow.AddHours(1),
                    Status = RadioInviteStatus.Accepted, CreatedAt = DateTime.UtcNow
                }
            };
            _repo.Setup(r => r.GetInvitesByStationAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(invites);

            var handler = new GetRadioInvitesHandler(_repo.Object);
            var result = (await handler.Handle(new GetRadioInvitesQuery(5), CancellationToken.None)).ToList();

            Assert.Equal(2, result.Count);
            Assert.Equal("a@test.com", result[0].Email);
            Assert.Equal("Accepted", result[1].Status);
        }

        [Fact]
        public async Task GetRadioInvites_ExpiredPending_StatusIsExpired()
        {
            var invites = new List<RadioStationInvite>
            {
                new()
                {
                    Id = 1, Email = "old@test.com",
                    ValidFrom = DateTime.UtcNow.AddDays(-2), ValidTo = DateTime.UtcNow.AddDays(-1),
                    Status = RadioInviteStatus.Pending, CreatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };
            _repo.Setup(r => r.GetInvitesByStationAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(invites);

            var handler = new GetRadioInvitesHandler(_repo.Object);
            var result = (await handler.Handle(new GetRadioInvitesQuery(1), CancellationToken.None)).ToList();

            Assert.Single(result);
            Assert.Equal("Expired", result[0].Status);
        }

        [Fact]
        public async Task RevokeRadioInvite_ExistingInvite_ReturnsTrue()
        {
            var invite = new RadioStationInvite { Id = 3, RadioStationId = 1, Status = RadioInviteStatus.Pending };
            _repo.Setup(r => r.GetInviteByIdAsync(3, 1, It.IsAny<CancellationToken>())).ReturnsAsync(invite);
            _repo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            var handler = new RevokeRadioInviteHandler(_repo.Object);
            var result = await handler.Handle(new RevokeRadioInviteCommand(1, 3), CancellationToken.None);

            Assert.True(result);
            Assert.Equal(RadioInviteStatus.Revoked, invite.Status);
            Assert.NotNull(invite.RevokedAt);
        }

        [Fact]
        public async Task RevokeRadioInvite_NonExistent_ReturnsFalse()
        {
            _repo.Setup(r => r.GetInviteByIdAsync(999, 1, It.IsAny<CancellationToken>())).ReturnsAsync((RadioStationInvite?)null);

            var handler = new RevokeRadioInviteHandler(_repo.Object);
            var result = await handler.Handle(new RevokeRadioInviteCommand(1, 999), CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task GetRadioInvites_EmptyStation_ReturnsEmpty()
        {
            _repo.Setup(r => r.GetInvitesByStationAsync(42, It.IsAny<CancellationToken>())).ReturnsAsync(new List<RadioStationInvite>());

            var handler = new GetRadioInvitesHandler(_repo.Object);
            var result = await handler.Handle(new GetRadioInvitesQuery(42), CancellationToken.None);

            Assert.Empty(result);
        }
    }
}
