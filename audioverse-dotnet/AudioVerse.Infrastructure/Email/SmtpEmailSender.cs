using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AudioVerse.Infrastructure.Email
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpOptions _opts;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IOptions<SmtpOptions> opts, ILogger<SmtpEmailSender> logger)
        {
            _opts = opts.Value;
            _logger = logger;
        }

        public async Task SendAsync(string to, string subject, string body, bool html = true)
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_opts.From));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var builder = new BodyBuilder();
            if (html) builder.HtmlBody = body; else builder.TextBody = body;
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            try
            {
                await client.ConnectAsync(_opts.Host, _opts.Port, _opts.UseSsl);
                if (!string.IsNullOrEmpty(_opts.Username))
                {
                    await client.AuthenticateAsync(_opts.Username, _opts.Password);
                }
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("Sent email to {To} via {Host}:{Port}", to, _opts.Host, _opts.Port);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send email to {To}", to);
                throw;
            }
        }
    }
}
