namespace AudioVerse.Application.Queries.Events;

public class EventSettlementDto
{
    public int EventId { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal Balance { get; set; }
    public List<ParticipantBalanceDto> Participants { get; set; } = new();
}
