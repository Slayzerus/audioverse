namespace AudioVerse.Application.Models
{
    public class OtpGenerationResult
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Otp { get; set; } = string.Empty; // Plain text - dla admina
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
    }
}
