namespace AudioVerse.Application.Models.Requests.User
{
    public class ChangePasswordWithRecaptchaRequest
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string RecaptchaToken { get; set; } = string.Empty;
    }
}
