namespace AudioVerse.Application.Models
{
    public class TokenPair
    {
        public TokenPair()
        {
            
        }

        public TokenPair(string accessToken, string refreshToken)
        {
            AccessToken = accessToken;
            RefreshToken = refreshToken;
        }

        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
