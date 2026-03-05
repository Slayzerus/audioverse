using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ImportExpensesFromPollHandler(IEventRepository r) : IRequestHandler<ImportExpensesFromPollCommand, int>
{
    public async Task<int> Handle(ImportExpensesFromPollCommand req, CancellationToken ct)
    {
        var poll = await r.GetPollByIdAsync(req.PollId);
        if (poll == null) return 0;

        var options = await r.GetPollOptionsAsync(poll.Id);
        var responses = await r.GetPollResponsesAsync(poll.Id);

        int count = 0;
        foreach (var opt in options.Where(o => o.UnitCost.HasValue && o.UnitCost > 0))
        {
            var totalQty = responses.Where(rr => rr.OptionId == opt.Id).Sum(rr => rr.Quantity > 0 ? rr.Quantity : 1);
            if (totalQty == 0) continue;

            var expense = new EventExpense
            {
                EventId = poll.EventId,
                Title = opt.Text,
                Amount = opt.UnitCost!.Value * totalQty,
                Category = Domain.Enums.ExpenseCategory.Custom,
                SplitMethod = Domain.Enums.SplitMethod.ByPollResponse,
                SourcePollId = poll.Id
            };
            await r.AddExpenseAsync(expense);
            count++;
        }
        return count;
    }
}
