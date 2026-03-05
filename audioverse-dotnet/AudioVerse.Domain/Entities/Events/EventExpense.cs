using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Events
{
    /// <summary>
    /// A cost item for an event — food order, attraction fee, rental, etc.
    /// Can be linked to a poll (auto-imported from poll results) or created manually.
    /// </summary>
    public class EventExpense
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ExpenseCategory Category { get; set; }
        public decimal Amount { get; set; }
        public SplitMethod SplitMethod { get; set; } = SplitMethod.Equal;
        public int? SourcePollId { get; set; }
        public int? SourceMenuItemId { get; set; }
        public int? SourceAttractionId { get; set; }
        public int? PaidByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<EventExpenseShare> Shares { get; set; } = new();
    }
}
