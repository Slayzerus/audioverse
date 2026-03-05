using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Handlers.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using Moq;
using Xunit;

namespace AudioVerse.Tests.Unit.Handlers
{
    public class BillingHandlerTests
    {
        // ── SplitExpenseEqually ──

        [Fact]
        public async Task SplitEqually_ReturnsShareCount()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetExpenseByIdAsync(1)).ReturnsAsync(new EventExpense { Id = 1, EventId = 7, Amount = 300 });
            repo.Setup(r => r.GetExpenseSharesByEventAsync(7)).ReturnsAsync(new List<EventExpenseShare>
            {
                new() { UserId = 10, ShareAmount = 0 },
                new() { UserId = 20, ShareAmount = 0 },
                new() { UserId = 30, ShareAmount = 0 }
            });
            repo.Setup(r => r.DeleteExpenseSharesByExpenseAsync(1)).ReturnsAsync(true);
            repo.Setup(r => r.AddExpenseShareAsync(It.IsAny<EventExpenseShare>())).ReturnsAsync(1);

            var handler = new SplitExpenseEquallyHandler(repo.Object);
            var result = await handler.Handle(new SplitExpenseEquallyCommand(1), CancellationToken.None);

            Assert.Equal(3, result);
            repo.Verify(r => r.AddExpenseShareAsync(It.Is<EventExpenseShare>(s => s.ShareAmount == 100m)), Times.Exactly(3));
        }

        [Fact]
        public async Task SplitEqually_ReturnsZero_WhenExpenseNotFound()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetExpenseByIdAsync(999)).ReturnsAsync((EventExpense?)null);

            var handler = new SplitExpenseEquallyHandler(repo.Object);
            var result = await handler.Handle(new SplitExpenseEquallyCommand(999), CancellationToken.None);

            Assert.Equal(0, result);
        }

        [Fact]
        public async Task SplitEqually_ReturnsZero_WhenNoParticipants()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetExpenseByIdAsync(1)).ReturnsAsync(new EventExpense { Id = 1, EventId = 7, Amount = 100 });
            repo.Setup(r => r.GetExpenseSharesByEventAsync(7)).ReturnsAsync(new List<EventExpenseShare>());

            var handler = new SplitExpenseEquallyHandler(repo.Object);
            var result = await handler.Handle(new SplitExpenseEquallyCommand(1), CancellationToken.None);

            Assert.Equal(0, result);
        }

        // ── ImportExpensesFromPoll ──

        [Fact]
        public async Task ImportFromPoll_CreatesExpenses_FromPollOptions()
        {
            var repo = new Mock<IEventRepository>();
            var poll = new EventPoll { Id = 5, EventId = 7, Title = "Food" };
            repo.Setup(r => r.GetPollByIdAsync(5)).ReturnsAsync(poll);
            repo.Setup(r => r.GetPollOptionsAsync(5)).ReturnsAsync(new List<EventPollOption>
            {
                new() { Id = 1, PollId = 5, Text = "Pizza", UnitCost = 25 },
                new() { Id = 2, PollId = 5, Text = "Beer", UnitCost = 10 },
                new() { Id = 3, PollId = 5, Text = "Free item", UnitCost = null }
            });
            repo.Setup(r => r.GetPollResponsesAsync(5)).ReturnsAsync(new List<EventPollResponse>
            {
                new() { OptionId = 1, Quantity = 2 },
                new() { OptionId = 1, Quantity = 1 },
                new() { OptionId = 2, Quantity = 3 }
            });
            repo.Setup(r => r.AddExpenseAsync(It.IsAny<EventExpense>())).ReturnsAsync(1);

            var handler = new ImportExpensesFromPollHandler(repo.Object);
            var result = await handler.Handle(new ImportExpensesFromPollCommand(5), CancellationToken.None);

            Assert.Equal(2, result);
            repo.Verify(r => r.AddExpenseAsync(It.Is<EventExpense>(e => e.Title == "Pizza" && e.Amount == 75)), Times.Once);
            repo.Verify(r => r.AddExpenseAsync(It.Is<EventExpense>(e => e.Title == "Beer" && e.Amount == 30)), Times.Once);
        }

        [Fact]
        public async Task ImportFromPoll_ReturnsZero_WhenPollNotFound()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetPollByIdAsync(999)).ReturnsAsync((EventPoll?)null);

            var handler = new ImportExpensesFromPollHandler(repo.Object);
            var result = await handler.Handle(new ImportExpensesFromPollCommand(999), CancellationToken.None);

            Assert.Equal(0, result);
        }

        // ── Settlement ──

        [Fact]
        public async Task Settlement_CalculatesCorrectTotals()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.GetExpensesByEventAsync(7)).ReturnsAsync(new List<EventExpense>
            {
                new() { Id = 1, Amount = 200 },
                new() { Id = 2, Amount = 100 }
            });
            repo.Setup(r => r.GetPaymentsByEventAsync(7)).ReturnsAsync(new List<EventPayment>
            {
                new() { Id = 1, UserId = 10, Amount = 150, Status = PaymentStatus.Confirmed },
                new() { Id = 2, UserId = 20, Amount = 50, Status = PaymentStatus.Confirmed }
            });
            repo.Setup(r => r.GetExpenseSharesByEventAsync(7)).ReturnsAsync(new List<EventExpenseShare>
            {
                new() { UserId = 10, ShareAmount = 150 },
                new() { UserId = 20, ShareAmount = 150 }
            });

            var handler = new GetEventBillingSettlementHandler(repo.Object);
            var result = await handler.Handle(new GetEventBillingSettlementQuery(7), CancellationToken.None);

            Assert.Equal(300, result.TotalExpenses);
            Assert.Equal(200, result.TotalPayments);
            Assert.Equal(2, result.Participants.Count);
            Assert.True(result.Participants.First(p => p.UserId == 10).IsSettled);
            Assert.False(result.Participants.First(p => p.UserId == 20).IsSettled);
        }

        // ── Simple CRUD delegates ──

        [Fact]
        public async Task AddExpense_DelegatesToRepo()
        {
            var repo = new Mock<IEventRepository>();
            var expense = new EventExpense { EventId = 7, Title = "Test", Amount = 50 };
            repo.Setup(r => r.AddExpenseAsync(expense)).ReturnsAsync(42);

            var handler = new AddExpenseHandler(repo.Object);
            var result = await handler.Handle(new AddExpenseCommand(expense), CancellationToken.None);

            Assert.Equal(42, result);
        }

        [Fact]
        public async Task AddPayment_DelegatesToRepo()
        {
            var repo = new Mock<IEventRepository>();
            var payment = new EventPayment { EventId = 7, Amount = 100 };
            repo.Setup(r => r.AddPaymentAsync(payment)).ReturnsAsync(55);

            var handler = new AddPaymentHandler(repo.Object);
            var result = await handler.Handle(new AddPaymentCommand(payment), CancellationToken.None);

            Assert.Equal(55, result);
        }

        [Fact]
        public async Task ConfirmPayment_DelegatesToRepo()
        {
            var repo = new Mock<IEventRepository>();
            repo.Setup(r => r.ConfirmPaymentAsync(10, 1)).ReturnsAsync(true);

            var handler = new ConfirmPaymentHandler(repo.Object);
            var result = await handler.Handle(new ConfirmPaymentCommand(10, 1), CancellationToken.None);

            Assert.True(result);
        }
    }
}
