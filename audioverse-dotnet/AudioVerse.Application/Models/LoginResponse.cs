namespace AudioVerse.Application.Models
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public string? ErrorMessage { get; set; }
        public bool IsBlocked { get; set; }
        public bool RequirePasswordChange { get; set; }
        public int? UserId { get; set; }
        public string? Username { get; set; }
    }
}
