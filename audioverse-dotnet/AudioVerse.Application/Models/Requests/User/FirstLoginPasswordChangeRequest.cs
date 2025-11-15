namespace AudioVerse.Application.Models.Requests.User
{
    public class FirstLoginPasswordChangeRequest
    {
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
