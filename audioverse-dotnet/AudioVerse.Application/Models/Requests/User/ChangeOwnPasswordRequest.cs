namespace AudioVerse.Application.Models.Requests.User
{
    public class ChangeOwnPasswordRequest
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
