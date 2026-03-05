namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// Honey token — decoy field used to detect bots and automated abuse.
    /// </summary>
    public class HoneyToken
    {
        public int Id { get; set; }
        public string TokenId { get; set; } = string.Empty; // Unikalne ID tokenu
        public string Type { get; set; } = string.Empty; // "HTTP", "DNS", "Database", "Email"
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsTriggered { get; set; } = false;
        public DateTime? TriggeredAt { get; set; }
        public string? TriggeredFrom { get; set; } // IP address
        public string? TriggeredDetails { get; set; } // JSON details
        public string NotificationUrl { get; set; } = string.Empty; // Canarytokens webhook
    }
}
