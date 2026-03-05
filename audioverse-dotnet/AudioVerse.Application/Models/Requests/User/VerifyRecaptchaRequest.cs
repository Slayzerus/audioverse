namespace AudioVerse.Application.Models.Requests.User
{
    public class VerifyRecaptchaRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
