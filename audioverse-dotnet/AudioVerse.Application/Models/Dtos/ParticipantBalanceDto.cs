namespace AudioVerse.Application.Queries.Events;

public class ParticipantBalanceDto
{
    public int? UserId { get; set; }
    public string? Email { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public decimal TotalOwed { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal Balance { get; set; }
    public bool IsSettled { get; set; }
    public List<ExpenseShareDetailDto> Shares { get; set; } = new();
    public List<PaymentDetailDto> Payments { get; set; } = new();
}
