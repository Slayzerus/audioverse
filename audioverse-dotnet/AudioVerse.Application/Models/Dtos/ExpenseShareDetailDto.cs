namespace AudioVerse.Application.Queries.Events;

public class ExpenseShareDetailDto
{
    public int ExpenseId { get; set; }
    public string ExpenseTitle { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal ShareAmount { get; set; }
    public int Quantity { get; set; }
}
