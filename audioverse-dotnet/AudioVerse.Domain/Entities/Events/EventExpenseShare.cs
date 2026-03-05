namespace AudioVerse.Domain.Entities.Events
{
    /// <summary>
    /// How much of an expense is assigned to a specific participant.
    /// </summary>
    public class EventExpenseShare
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public EventExpense? Expense { get; set; }
        public int? UserId { get; set; }
        public string? Email { get; set; }
        public decimal ShareAmount { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
