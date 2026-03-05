namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// Configuration options for RabbitMQ connection.
/// </summary>
public class RabbitMqOptions
{
    public bool Enabled { get; set; } = true;
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = "audioverse";
    public string Password { get; set; } = "audioverse";
    public string VirtualHost { get; set; } = "/";
}
