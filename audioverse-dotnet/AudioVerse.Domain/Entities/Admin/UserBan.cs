namespace AudioVerse.Domain.Entities.Admin
{
    /// <summary>
    /// User ban record with reason, duration, and moderator details.
    /// </summary>
    public class UserBan
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int? BannedByAdminId { get; set; }
        public DateTime BannedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
