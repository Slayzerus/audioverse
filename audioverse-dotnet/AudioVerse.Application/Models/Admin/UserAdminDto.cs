namespace AudioVerse.Application.Models.Admin
{
    public class UserAdminDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsBlocked { get; set; }
        public string Roles { get; set; } = string.Empty;
        public bool IsGuest { get; set; }
    }
}
