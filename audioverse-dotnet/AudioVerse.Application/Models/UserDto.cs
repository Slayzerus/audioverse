namespace AudioVerse.Application.Models
{
    public class UserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool IsBlocked { get; set; }
        public bool RequirePasswordChange { get; set; }
        public DateTime? PasswordExpiryDate { get; set; }
        public int? PasswordValidityDays { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastPasswordChangeDate { get; set; }
        public bool IsAdmin { get; set; }
    }
}
