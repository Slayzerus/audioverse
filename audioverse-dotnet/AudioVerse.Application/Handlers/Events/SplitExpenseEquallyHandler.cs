using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class SplitExpenseEquallyHandler(IEventRepository r) : IRequestHandler<SplitExpenseEquallyCommand, int>
{
    public async Task<int> Handle(SplitExpenseEquallyCommand req, CancellationToken ct)
    {
        var expense = await r.GetExpenseByIdAsync(req.ExpenseId);
        if (expense == null) return 0;

        var participants = await r.GetExpenseSharesByEventAsync(expense.EventId);
        var distinctUsers = participants.Select(s => s.UserId ?? 0).Where(id => id > 0).Distinct().ToList();
        if (distinctUsers.Count == 0) return 0;

        await r.DeleteExpenseSharesByExpenseAsync(req.ExpenseId);

        var shareAmount = expense.Amount / distinctUsers.Count;
        int count = 0;
        foreach (var uid in distinctUsers)
        {
            await r.AddExpenseShareAsync(new EventExpenseShare
            {
                ExpenseId = req.ExpenseId,
                UserId = uid,
                ShareAmount = shareAmount
            });
            count++;
        }
        return count;
    }
}
