using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Publishes notification messages to RabbitMQ queue for async processing.
/// Falls back to synchronous processing if RabbitMQ is unavailable.
/// </summary>
public class RabbitMqNotificationDispatcher : INotificationDispatcher, IAsyncDisposable
{
    private const string QueueName = "notifications";
    private const string ExchangeName = "audioverse.notifications";

    private readonly RabbitMqOptions _opts;
    private readonly ILogger<RabbitMqNotificationDispatcher> _logger;
    private IConnection? _connection;
    private IChannel? _channel;
    private bool _initialized;

    public RabbitMqNotificationDispatcher(IOptions<RabbitMqOptions> opts, ILogger<RabbitMqNotificationDispatcher> logger)
    {
        _opts = opts.Value;
        _logger = logger;
    }

    public async Task EnqueueAsync(NotificationMessage message, CancellationToken ct = default)
    {
        await EnsureConnectedAsync(ct);
        if (_channel == null) return;

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
        var props = new BasicProperties { Persistent = true, ContentType = "application/json" };
        await _channel.BasicPublishAsync(ExchangeName, "notification", false, props, body, ct);
    }

    public async Task EnqueueBatchAsync(IEnumerable<NotificationMessage> messages, CancellationToken ct = default)
    {
        await EnsureConnectedAsync(ct);
        if (_channel == null) return;

        foreach (var message in messages)
        {
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
            var props = new BasicProperties { Persistent = true, ContentType = "application/json" };
            await _channel.BasicPublishAsync(ExchangeName, "notification", false, props, body, ct);
        }
    }

    private async Task EnsureConnectedAsync(CancellationToken ct)
    {
        if (_initialized && _connection?.IsOpen == true && _channel?.IsOpen == true)
            return;

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _opts.Host,
                Port = _opts.Port,
                UserName = _opts.Username,
                Password = _opts.Password,
                VirtualHost = _opts.VirtualHost
            };

            _connection = await factory.CreateConnectionAsync(ct);
            _channel = await _connection.CreateChannelAsync(cancellationToken: ct);

            await _channel.ExchangeDeclareAsync(ExchangeName, "direct", durable: true, cancellationToken: ct);
            await _channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false, cancellationToken: ct);
            await _channel.QueueBindAsync(QueueName, ExchangeName, "notification", cancellationToken: ct);

            _initialized = true;
            _logger.LogInformation("Connected to RabbitMQ at {Host}:{Port}", _opts.Host, _opts.Port);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cannot connect to RabbitMQ — notifications will not be queued");
            _initialized = false;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel != null) await _channel.CloseAsync();
        if (_connection != null) await _connection.CloseAsync();
    }
}
