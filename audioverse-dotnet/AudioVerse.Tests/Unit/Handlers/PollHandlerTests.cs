using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class PollHandlerTests
    {
        [Fact]
        public async Task CreatePoll_GeneratesToken_WhenEmpty()
        {
            var repo = new Mock<IEventRepository>();
            var poll = new EventPoll { EventId = 7, Title = "Test", Token = "" };
            repo.Setup(r => r.CreatePollAsync(It.IsAny<EventPoll>())).ReturnsAsync(1);

            var handler = new CreatePollHandler(repo.Object);
            await handler.Handle(new CreatePollCommand(poll), CancellationToken.None);

            repo.Verify(r => r.CreatePollAsync(It.Is<EventPoll>(p => !string.IsNullOrEmpty(p.Token))));
        }

        [Fact]
        public async Task CreatePoll_KeepsExistingToken()
        {
            var repo = new Mock<IEventRepository>();
            var poll = new EventPoll { EventId = 7, Title = "Test", Token = "my-custom-token" };
            repo.Setup(r => r.CreatePollAsync(It.IsAny<EventPoll>())).ReturnsAsync(1);

            var handler = new CreatePollHandler(repo.Object);
            await handler.Handle(new CreatePollCommand(poll), CancellationToken.None);

            repo.Verify(r => r.CreatePollAsync(It.Is<EventPoll>(p => p.Token == "my-custom-token")));
        }

        [Fact]
        public async Task SubmitResponse_ReturnsFalse_WhenPollNotFound()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByTokenAsync("bad")).ReturnsAsync((EventPoll?)null);

            var handler = new SubmitPollResponseHandler(repo.Object);
            var result = await handler.Handle(
                new SubmitPollResponseCommand("bad", new List<int> { 1 }, "a@b.c", null, null),
                CancellationToken.None);

            Assert.False(result);
        }

        [Fact]
        public async Task SubmitResponse_CreatesResponsesForEachOption()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByTokenAsync("tok")).ReturnsAsync(new EventPoll { Id = 5, EventId = 7 });
            repo.Setup(r => r.AddPollResponseAsync(It.IsAny<EventPollResponse>())).ReturnsAsync(1);

            var handler = new SubmitPollResponseHandler(repo.Object);
            var result = await handler.Handle(
                new SubmitPollResponseCommand("tok", new List<int> { 1, 2, 3 }, "a@b.c", null, null),
                CancellationToken.None);

            Assert.True(result);
            repo.Verify(r => r.AddPollResponseAsync(It.IsAny<EventPollResponse>()), Times.Exactly(3));
        }

        [Fact]
        public async Task SubmitResponse_UsesQuantities()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByTokenAsync("tok")).ReturnsAsync(new EventPoll { Id = 5, EventId = 7 });
            repo.Setup(r => r.AddPollResponseAsync(It.IsAny<EventPollResponse>())).ReturnsAsync(1);

            var quantities = new Dictionary<int, int> { { 1, 5 } };
            var handler = new SubmitPollResponseHandler(repo.Object);
            await handler.Handle(
                new SubmitPollResponseCommand("tok", new List<int> { 1 }, "a@b.c", null, quantities),
                CancellationToken.None);

            repo.Verify(r => r.AddPollResponseAsync(It.Is<EventPollResponse>(rr => rr.Quantity == 5)));
        }

        [Fact]
        public async Task GetResults_ReturnsNull_WhenPollNotFound()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByIdAsync(999)).ReturnsAsync((EventPoll?)null);

            var handler = new GetPollResultsHandler(repo.Object);
            var result = await handler.Handle(new GetPollResultsQuery(999), CancellationToken.None);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetResults_CalculatesPercentageAndCost()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByIdAsync(5)).ReturnsAsync(new EventPoll
            {
                Id = 5,
                EventId = 7,
                Title = "Food",
                Type = Domain.Enums.Events.EventPollType.SingleChoice,
                OptionSource = Domain.Enums.Events.EventPollOptionSource.Manual
            });
            repo.Setup(r => r.GetPollOptionsAsync(5)).ReturnsAsync(new List<EventPollOption>
            {
                new() { Id = 1, PollId = 5, Text = "Pizza", UnitCost = 25 },
                new() { Id = 2, PollId = 5, Text = "Sushi", UnitCost = 40 }
            });
            repo.Setup(r => r.GetPollResponsesAsync(5)).ReturnsAsync(new List<EventPollResponse>
            {
                new() { OptionId = 1, Quantity = 2, RespondentEmail = "a@b.c" },
                new() { OptionId = 1, Quantity = 1, RespondentEmail = "c@d.e" },
                new() { OptionId = 2, Quantity = 1, RespondentEmail = "f@g.h" }
            });

            var handler = new GetPollResultsHandler(repo.Object);
            var result = await handler.Handle(new GetPollResultsQuery(5), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(3, result!.TotalResponses);
            Assert.Equal(3, result.UniqueRespondents);
            Assert.Equal(2, result.Options.Count);

            var pizza = result.Options.First(o => o.Text == "Pizza");
            Assert.Equal(2, pizza.Count);
            Assert.Equal(3, pizza.TotalQuantity);
            Assert.Equal(75m, pizza.LineCost);

            var sushi = result.Options.First(o => o.Text == "Sushi");
            Assert.Equal(1, sushi.Count);
            Assert.Equal(40m, sushi.LineCost);

            Assert.Equal(115m, result.TotalCost);
        }

        [Fact]
        public async Task SendEmails_ReturnsCount()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByIdAsync(5)).ReturnsAsync(new EventPoll { Id = 5, Title = "Test Poll", Token = "abc123" });
            var emailSender = new Mock<AudioVerse.Infrastructure.Email.IEmailSender>();
            emailSender.Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), true))
                .Returns(Task.CompletedTask);
            var handler = new SendPollEmailsHandler(repo.Object, emailSender.Object);
            var result = await handler.Handle(
                new SendPollEmailsCommand(5, new List<string> { "a@b.c", "d@e.f" }, "https://example.com"),
                CancellationToken.None);

            Assert.Equal(2, result);
            emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), true), Times.Exactly(2));
        }
    }
}
