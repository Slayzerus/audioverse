using System.Text;
using System.Text.Json;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Enums;
using AudioVerse.Infrastructure.Email;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Background service that consumes notification messages from RabbitMQ
/// and dispatches them to in-app DB, email, and SMS channels.
/// </summary>
public class NotificationConsumerService : BackgroundService
{
    private const string QueueName = "notifications";
    private const string ExchangeName = "audioverse.notifications";

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqOptions _opts;
    private readonly ILogger<NotificationConsumerService> _logger;

    public NotificationConsumerService(
        IServiceScopeFactory scopeFactory,
        IOptions<RabbitMqOptions> opts,
        ILogger<NotificationConsumerService> logger)
    {
        _scopeFactory = scopeFactory;
        _opts = opts.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        const int maxDelaySec = 300; // cap at 5 min
        int attempt = 0;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConsumeLoop(stoppingToken);
                attempt = 0; // reset on successful connection
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                attempt++;
                var delaySec = Math.Min((int)Math.Pow(2, attempt), maxDelaySec);

                if (attempt <= 3)
                    _logger.LogWarning("RabbitMQ consumer error (attempt {Attempt}) — reconnecting in {Delay}s: {Message}", attempt, delaySec, ex.Message);
                else if (attempt == 4)
                    _logger.LogWarning("RabbitMQ consumer unavailable — suppressing repeated logs, retrying every {Delay}s", delaySec);
                // after attempt 4, stay silent until successful reconnect

                await Task.Delay(TimeSpan.FromSeconds(delaySec), stoppingToken);
            }
        }
    }

    private async Task ConsumeLoop(CancellationToken ct)
    {
        var factory = new ConnectionFactory
        {
            HostName = _opts.Host,
            Port = _opts.Port,
            UserName = _opts.Username,
            Password = _opts.Password,
            VirtualHost = _opts.VirtualHost
        };

        await using var connection = await factory.CreateConnectionAsync(ct);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: ct);

        await channel.ExchangeDeclareAsync(ExchangeName, "direct", durable: true, cancellationToken: ct);
        await channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false, cancellationToken: ct);
        await channel.QueueBindAsync(QueueName, ExchangeName, "notification", cancellationToken: ct);
        await channel.BasicQosAsync(0, 10, false, ct);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            try
            {
                var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                var message = JsonSerializer.Deserialize<NotificationMessage>(body);
                if (message != null)
                    await ProcessMessageAsync(message);
                await channel.BasicAckAsync(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to process notification message");
                await channel.BasicNackAsync(ea.DeliveryTag, false, true);
            }
        };

        await channel.BasicConsumeAsync(QueueName, false, consumer, ct);
        _logger.LogInformation("Notification consumer started on queue '{Queue}'", QueueName);

        // Keep alive until cancelled
        await Task.Delay(Timeout.Infinite, ct);
    }

    private async Task ProcessMessageAsync(NotificationMessage msg)
    {
        using var scope = _scopeFactory.CreateScope();

        // In-App notification
        if (msg.Channels.HasFlag(NotificationChannel.InApp) && msg.UserId.HasValue)
        {
            try
            {
                var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
                db.Notifications.Add(new Notification
                {
                    UserId = msg.UserId.Value,
                    Title = msg.Title,
                    Body = msg.Body,
                    Type = ParseNotificationType(msg.Category)
                });
                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to save in-app notification for user {UserId}", msg.UserId);
            }
        }

        // Email
        if (msg.Channels.HasFlag(NotificationChannel.Email) && !string.IsNullOrEmpty(msg.Email))
        {
            try
            {
                var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await emailSender.SendAsync(msg.Email, msg.Title, msg.HtmlBody ?? msg.Body, html: msg.HtmlBody != null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send email to {Email}", msg.Email);
            }
        }

        // SMS
        if (msg.Channels.HasFlag(NotificationChannel.Sms) && !string.IsNullOrEmpty(msg.PhoneNumber))
        {
            try
            {
                var smsSender = scope.ServiceProvider.GetRequiredService<ISmsSender>();
                if (smsSender.IsConfigured)
                {
                    var smsText = msg.Body.Length > 160 ? msg.Body[..157] + "..." : msg.Body;
                    await smsSender.SendAsync(msg.PhoneNumber, smsText);
                }
                else
                {
                    _logger.LogDebug("SMS channel requested but SMSAPI not configured — skipping");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send SMS to {Phone}", msg.PhoneNumber?[..4] + "***");
            }
        }
    }

    private static NotificationType ParseNotificationType(string? category)
    {
        if (string.IsNullOrEmpty(category)) return NotificationType.General;
        return Enum.TryParse<NotificationType>(category, true, out var t) ? t : NotificationType.General;
    }
}
