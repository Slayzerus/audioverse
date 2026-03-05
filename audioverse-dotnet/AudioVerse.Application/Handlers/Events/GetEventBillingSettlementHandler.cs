using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetEventBillingSettlementHandler(IEventRepository r) : IRequestHandler<GetEventBillingSettlementQuery, EventSettlementDto>
{
    public async Task<EventSettlementDto> Handle(GetEventBillingSettlementQuery req, CancellationToken ct)
    {
        var expenses = (await r.GetExpensesByEventAsync(req.EventId)).ToList();
        var payments = (await r.GetPaymentsByEventAsync(req.EventId)).ToList();
        var shares = (await r.GetExpenseSharesByEventAsync(req.EventId)).ToList();

        var totalExpenses = expenses.Sum(e => e.Amount);
        var totalPayments = payments.Sum(p => p.Amount);

        var participantIds = shares.Select(s => s.UserId ?? 0).Union(payments.Select(p => p.UserId ?? 0)).Where(id => id > 0).Distinct();

        var participants = participantIds.Select(uid =>
        {
            var owed = shares.Where(s => s.UserId == uid).Sum(s => s.ShareAmount);
            var paid = payments.Where(p => p.UserId == uid && p.Status == Domain.Enums.PaymentStatus.Confirmed).Sum(p => p.Amount);
            return new ParticipantBalanceDto
            {
                UserId = uid,
                TotalOwed = owed,
                TotalPaid = paid,
                Balance = paid - owed,
                IsSettled = paid >= owed
            };
        }).ToList();

        return new EventSettlementDto
        {
            EventId = req.EventId,
            TotalExpenses = totalExpenses,
            TotalPayments = totalPayments,
            Balance = totalPayments - totalExpenses,
            Participants = participants
        };
    }
}
