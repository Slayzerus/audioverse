namespace AudioVerse.Infrastructure.Email
{
    public class SmtpOptions
    {
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 1025; // MailHog default
        public bool UseSsl { get; set; } = false;
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string From { get; set; } = "no-reply@audioverse.local";
    }
}
