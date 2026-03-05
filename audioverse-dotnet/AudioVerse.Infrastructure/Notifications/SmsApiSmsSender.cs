using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AudioVerse.Infrastructure.Notifications;

/// <summary>
/// SMS sender via SMSAPI.pl — najtańszy polski gateway SMS przy małym ruchu (~0.07 PLN/SMS).
/// Wymaga tokenu OAuth z panelu https://ssl.smsapi.pl/
/// </summary>
public class SmsApiSmsSender : ISmsSender
{
    private readonly SmsApiOptions _opts;
    private readonly HttpClient _http;
    private readonly ILogger<SmsApiSmsSender> _logger;

    public SmsApiSmsSender(IOptions<SmsApiOptions> opts, HttpClient http, ILogger<SmsApiSmsSender> logger)
    {
        _opts = opts.Value;
        _http = http;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_opts.ApiToken);

    public async Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogDebug("SMS not sent — SMSAPI token not configured");
            return;
        }

        // Normalize Polish number: +48XXXXXXXXX or 48XXXXXXXXX
        var normalized = phoneNumber.Replace(" ", "").Replace("-", "");
        if (normalized.StartsWith("+")) normalized = normalized[1..];
        if (normalized.Length == 9) normalized = "48" + normalized;

        var request = new HttpRequestMessage(HttpMethod.Post, $"{_opts.BaseUrl}/sms.do");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _opts.ApiToken);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["to"] = normalized,
            ["message"] = message,
            ["format"] = "json",
            ["from"] = _opts.DefaultSenderName ?? "AudioVerse",
            ["encoding"] = "utf-8"
        });

        try
        {
            var response = await _http.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("SMSAPI error {Status}: {Body}", response.StatusCode, body);
                return;
            }

            // Parse SMSAPI response
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var err))
            {
                var code = err.GetInt32();
                if (code != 0)
                {
                    var msg = doc.RootElement.TryGetProperty("message", out var m) ? m.GetString() : "unknown";
                    _logger.LogWarning("SMSAPI returned error {Code}: {Message}", code, msg);
                    return;
                }
            }

            _logger.LogInformation("SMS sent to {Phone} via SMSAPI.pl", normalized[..4] + "***");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send SMS to {Phone}", normalized[..4] + "***");
        }
    }
}
