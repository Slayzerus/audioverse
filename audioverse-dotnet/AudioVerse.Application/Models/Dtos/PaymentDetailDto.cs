namespace AudioVerse.Application.Queries.Events;

public class PaymentDetailDto
{
    public int PaymentId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime PaidAt { get; set; }
}
