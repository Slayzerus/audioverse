namespace AudioVerse.Application.Commands.User
{
    public class GuestLoginResult
    {
        public bool Success { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
