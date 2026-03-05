using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IBillingRepository.
/// Handles event expenses, shares, and payments.
/// </summary>
public class BillingRepositoryEF : IBillingRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<BillingRepositoryEF> _logger;

    public BillingRepositoryEF(AudioVerseDbContext dbContext, ILogger<BillingRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // ????????????????????????????????????????????????????????????
    //  EXPENSES
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddExpenseAsync(EventExpense expense)
    {
        expense.CreatedAt = DateTime.UtcNow;
        _dbContext.EventExpenses.Add(expense);
        await _dbContext.SaveChangesAsync();
        return expense.Id;
    }

    /// <inheritdoc />
    public async Task<EventExpense?> GetExpenseByIdAsync(int id)
    {
        return await _dbContext.EventExpenses
            .Include(e => e.Shares)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventExpense>> GetExpensesByEventAsync(int eventId)
    {
        return await _dbContext.EventExpenses
            .Where(e => e.EventId == eventId)
            .Include(e => e.Shares)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdateExpenseAsync(EventExpense expense)
    {
        var existing = await _dbContext.EventExpenses.FindAsync(expense.Id);
        if (existing == null) return false;

        existing.Title = expense.Title;
        existing.Description = expense.Description;
        existing.Category = expense.Category;
        existing.Amount = expense.Amount;
        existing.SplitMethod = expense.SplitMethod;
        existing.PaidByUserId = expense.PaidByUserId;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteExpenseAsync(int id)
    {
        var expense = await _dbContext.EventExpenses
            .Include(e => e.Shares)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (expense == null) return false;

        _dbContext.EventExpenseShares.RemoveRange(expense.Shares);
        _dbContext.EventExpenses.Remove(expense);
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Expense {Id} deleted", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<decimal> GetTotalExpensesAsync(int eventId)
    {
        return await _dbContext.EventExpenses
            .Where(e => e.EventId == eventId)
            .SumAsync(e => e.Amount);
    }

    // ????????????????????????????????????????????????????????????
    //  EXPENSE SHARES
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddExpenseShareAsync(EventExpenseShare share)
    {
        _dbContext.EventExpenseShares.Add(share);
        await _dbContext.SaveChangesAsync();
        return share.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventExpenseShare>> GetSharesByExpenseAsync(int expenseId)
    {
        return await _dbContext.EventExpenseShares
            .Where(s => s.ExpenseId == expenseId)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> DeleteSharesByExpenseAsync(int expenseId)
    {
        var shares = await _dbContext.EventExpenseShares
            .Where(s => s.ExpenseId == expenseId)
            .ToListAsync();

        if (shares.Count == 0) return false;

        _dbContext.EventExpenseShares.RemoveRange(shares);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // ????????????????????????????????????????????????????????????
    //  PAYMENTS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<int> AddPaymentAsync(EventPayment payment)
    {
        payment.PaidAt = DateTime.UtcNow;
        _dbContext.EventPayments.Add(payment);
        await _dbContext.SaveChangesAsync();
        return payment.Id;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventPayment>> GetPaymentsByEventAsync(int eventId)
    {
        return await _dbContext.EventPayments
            .Where(p => p.EventId == eventId)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventPayment>> GetPaymentsByPayerAsync(int eventId, int payerId)
    {
        return await _dbContext.EventPayments
            .Where(p => p.EventId == eventId && p.UserId == payerId)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> ConfirmPaymentAsync(int paymentId)
    {
        var payment = await _dbContext.EventPayments.FindAsync(paymentId);
        if (payment == null) return false;

        payment.Status = PaymentStatus.Confirmed;
        payment.ConfirmedAt = DateTime.UtcNow;
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Payment {Id} confirmed", paymentId);
        return true;
    }

    // ????????????????????????????????????????????????????????????
    //  SETTLEMENTS
    // ????????????????????????????????????????????????????????????

    /// <inheritdoc />
    public async Task<IDictionary<int, decimal>> CalculateBalancesAsync(int eventId)
    {
        var balances = new Dictionary<int, decimal>();

        // Get all expense shares for this event
        var shares = await _dbContext.EventExpenseShares
            .Where(s => s.Expense!.EventId == eventId && s.UserId.HasValue)
            .Select(s => new { UserId = s.UserId!.Value, Amount = s.ShareAmount * s.Quantity })
            .ToListAsync();

        // Add what each person owes
        foreach (var share in shares)
        {
            if (!balances.ContainsKey(share.UserId))
                balances[share.UserId] = 0;
            balances[share.UserId] += share.Amount;
        }

        // Subtract what each person has paid
        var payments = await _dbContext.EventPayments
            .Where(p => p.EventId == eventId && p.UserId.HasValue && p.Status == PaymentStatus.Confirmed)
            .Select(p => new { UserId = p.UserId!.Value, p.Amount })
            .ToListAsync();

        foreach (var payment in payments)
        {
            if (!balances.ContainsKey(payment.UserId))
                balances[payment.UserId] = 0;
            balances[payment.UserId] -= payment.Amount;
        }

        // Also consider who paid for expenses (they are owed that amount)
        var expensePayments = await _dbContext.EventExpenses
            .Where(e => e.EventId == eventId && e.PaidByUserId.HasValue)
            .Select(e => new { UserId = e.PaidByUserId!.Value, e.Amount })
            .ToListAsync();

        foreach (var exp in expensePayments)
        {
            if (!balances.ContainsKey(exp.UserId))
                balances[exp.UserId] = 0;
            balances[exp.UserId] -= exp.Amount; // They paid, so they're owed
        }

        return balances;
    }

    /// <inheritdoc />
    public async Task<decimal> GetParticipantBalanceAsync(int eventId, int participantId)
    {
        var balances = await CalculateBalancesAsync(eventId);
        return balances.TryGetValue(participantId, out var balance) ? balance : 0;
    }
}
