namespace AudioVerse.Application.Models.Requests.Admin
{
    public class AdminChangeUserPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}
