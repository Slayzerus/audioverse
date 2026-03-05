namespace AudioVerse.Infrastructure.Security
{
    public class TokenEncryptionOptions
    {
        public string CurrentKeyId { get; set; } = "key1";
        public Dictionary<string, string> Keys { get; set; } = new();
    }
}
