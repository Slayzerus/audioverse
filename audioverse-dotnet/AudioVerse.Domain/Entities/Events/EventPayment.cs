using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Events
{
    /// <summary>
    /// A payment made by a participant towards the event's expenses.
    /// </summary>
    public class EventPayment
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int? UserId { get; set; }
        public string? Email { get; set; }
        public string? PayerName { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod Method { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? Reference { get; set; }
        public string? Note { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public int? ConfirmedByUserId { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }
}
