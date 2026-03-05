using Xunit;
using Moq;
using AudioVerse.Application.Commands.Moderation;
using AudioVerse.Application.Queries.Moderation;
using AudioVerse.Application.Handlers.Moderation;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class ModerationHandlerTests
    {
        private readonly Mock<IModerationRepository> _repo = new();

        [Fact]
        public async Task ReportAbuse_ReturnsTrue()
        {
            _repo.Setup(r => r.CreateReportAsync(It.IsAny<AbuseReport>())).ReturnsAsync(1);

            var handler = new ReportAbuseHandler(_repo.Object);
            var result = await handler.Handle(
                new ReportAbuseCommand(1, "tester", "Nickname", "BadWord", "Wulgaryzm", null),
                CancellationToken.None);

            Assert.True(result);
            _repo.Verify(r => r.CreateReportAsync(It.Is<AbuseReport>(
                a => a.TargetType == "Nickname" && a.Reason == "Wulgaryzm")), Times.Once);
        }

        [Fact]
        public async Task ReportAbuse_AnonymousReporter_Works()
        {
            _repo.Setup(r => r.CreateReportAsync(It.IsAny<AbuseReport>())).ReturnsAsync(2);

            var handler = new ReportAbuseHandler(_repo.Object);
            var result = await handler.Handle(
                new ReportAbuseCommand(null, null, "EventDescription", "Spam content", "Spam", "Test"),
                CancellationToken.None);

            Assert.True(result);
            _repo.Verify(r => r.CreateReportAsync(It.Is<AbuseReport>(
                a => a.ReporterUserId == null && a.Comment == "Test")), Times.Once);
        }

        [Fact]
        public async Task ResolveAbuseReport_Existing_ReturnsTrue()
        {
            _repo.Setup(r => r.ResolveReportAsync(5, 1, "Resolved")).ReturnsAsync(true);

            var handler = new ResolveAbuseReportHandler(_repo.Object);
            var result = await handler.Handle(
                new ResolveAbuseReportCommand(5, true, "Resolved", 1),
                CancellationToken.None);

            Assert.True(result);
        }

        [Fact]
        public async Task ResolveAbuseReport_NonExistent_ReturnsFalse()
        {
            _repo.Setup(r => r.ResolveReportAsync(999, 0, "")).ReturnsAsync(false);

            var handler = new ResolveAbuseReportHandler(_repo.Object);
            var result = await handler.Handle(
                new ResolveAbuseReportCommand(999, true, null),
                CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task GetAbuseReports_OpenFilter_ReturnsMapped()
        {
            var reports = new List<AbuseReport>
            {
                new() { Id = 1, ReporterUserId = 2, ReporterUsername = "user1", TargetType = "Nickname",
                    TargetValue = "BadNick", Reason = "Wulgaryzm", Resolved = false, CreatedAt = DateTime.UtcNow },
                new() { Id = 2, ReporterUserId = 3, ReporterUsername = "user2", TargetType = "Description",
                    TargetValue = "Spam", Reason = "Spam", Resolved = false, CreatedAt = DateTime.UtcNow }
            };
            _repo.Setup(r => r.GetReportsAsync(false, null, 1, 100)).ReturnsAsync(reports);

            var handler = new GetAbuseReportsHandler(_repo.Object);
            var result = await handler.Handle(new GetAbuseReportsQuery("open"), CancellationToken.None);

            Assert.Equal(2, result.Count);
            Assert.Equal("Nickname", result[0].TargetType);
            Assert.False(result[0].Resolved);
        }

        [Fact]
        public async Task GetAbuseReports_NoFilter_PassesNull()
        {
            _repo.Setup(r => r.GetReportsAsync(null, null, 1, 100)).ReturnsAsync(new List<AbuseReport>());

            var handler = new GetAbuseReportsHandler(_repo.Object);
            var result = await handler.Handle(new GetAbuseReportsQuery(), CancellationToken.None);

            Assert.Empty(result);
            _repo.Verify(r => r.GetReportsAsync(null, null, 1, 100), Times.Once);
        }
    }
}
