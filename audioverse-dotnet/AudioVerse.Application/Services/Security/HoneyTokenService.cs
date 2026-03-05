using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace AudioVerse.Application.Services.Security
{
    public class HoneyTokenService : IHoneyTokenService
    {
        private readonly IUserSecurityRepository _securityRepo;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private const string CanaryTokensApiUrl = "https://canarytokens.org/api/v1/create";
        private const string WebhookNotificationUrl = "https://api.audioverse.io/api/honeytokens/webhook";

        public HoneyTokenService(
            IUserSecurityRepository securityRepo,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _securityRepo = securityRepo;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<HoneyToken> CreateHoneyTokenAsync(string type, string description)
        {
            string tokenId = Guid.NewGuid().ToString();
            string? notificationUrl = null;

            // Spróbuj stworzyc token w Canarytokens
            try
            {
                var apiKey = _configuration["CanaryTokensSettings:ApiKey"];
                if (!string.IsNullOrEmpty(apiKey))
                {
                    notificationUrl = await CreateCanaryTokenAsync(apiKey, type, description);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"?? Warning: Nie udalo sie stworzyc tokena w Canarytokens: {ex.Message}. Tworze lokalny token.");
            }

            // Jesli tworzenie w Canarytokens sie nie powiodlo, utwórz lokalny token
            var honeyToken = new HoneyToken
            {
                TokenId = tokenId,
                Type = type,
                Description = description,
                CreatedAt = DateTime.UtcNow,
                IsTriggered = false,
                NotificationUrl = notificationUrl ?? $"http://localhost/honeytokens/{tokenId}"
            };

            await _securityRepo.AddHoneyTokenAsync(honeyToken);

            Console.WriteLine($"Honey Token created: {type} - {tokenId}");
            return honeyToken;
        }

        public async Task TriggerTokenAsync(int tokenId, string fromIp, Dictionary<string, object> details)
        {
            var token = await _securityRepo.GetHoneyTokenByIdAsync(tokenId);
            if (token == null)
                return;

            token.IsTriggered = true;
            token.TriggeredAt = DateTime.UtcNow;
            token.TriggeredFrom = fromIp;
            token.TriggeredDetails = JsonSerializer.Serialize(details);

            await _securityRepo.SaveChangesAsync();

            // Powiadom Canarytokens
            await NotifyTriggeredTokenAsync(token);
        }

        public async Task<List<HoneyToken>> GetTriggeredTokensAsync()
        {
            return (await _securityRepo.GetTriggeredHoneyTokensAsync()).ToList();
        }

        public async Task<HoneyToken?> GetTokenByIdAsync(string tokenId)
        {
            var all = await _securityRepo.GetAllHoneyTokensAsync();
            return all.FirstOrDefault(t => t.TokenId == tokenId);
        }

        /// <summary>
        /// Stworzy token na Canarytokens.org
        /// </summary>
        private async Task<string?> CreateCanaryTokenAsync(string apiKey, string type, string description)
        {
            try
            {
                using (var client = _httpClientFactory.CreateClient())
                {
                    var request = new
                    {
                        type = type.ToLower() switch
                        {
                            "http" => "http",
                            "dns" => "dns",
                            "database" => "sql_server",
                            "email" => "email",
                            "cloned_website" => "cloned_website",
                            _ => "http"
                        },
                        name = description,
                        notify_webhook = WebhookNotificationUrl
                    };

                    var content = new StringContent(
                        JsonSerializer.Serialize(request),
                        System.Text.Encoding.UTF8,
                        "application/json"
                    );

                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                    var response = await client.PostAsync(CanaryTokensApiUrl, content);
                    response.EnsureSuccessStatusCode();

                    var responseContent = await response.Content.ReadAsStringAsync();
                    var responseObject = JsonSerializer.Deserialize<JsonElement>(responseContent);

                    if (responseObject.TryGetProperty("canarytoken", out var tokenProp))
                    {
                        return tokenProp.GetString();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"? Error creating Canary Token: {ex.Message}");
                throw;
            }

            return null;
        }

        /// <summary>
        /// Powiadom o aktywacji tokena
        /// </summary>
        private async Task NotifyTriggeredTokenAsync(HoneyToken token)
        {
            try
            {
                var notification = new
                {
                    token = token.TokenId,
                    type = token.Type,
                    description = token.Description,
                    triggeredAt = token.TriggeredAt,
                    triggeredFrom = token.TriggeredFrom,
                    details = token.TriggeredDetails,
                    severity = "CRITICAL"
                };

                // Loguj do konsoli
                Console.WriteLine($"?????? HONEY TOKEN TRIGGERED!");
                Console.WriteLine($"Type: {token.Type}");
                Console.WriteLine($"From IP: {token.TriggeredFrom}");
                Console.WriteLine($"Details: {token.TriggeredDetails}");
                Console.WriteLine(JsonSerializer.Serialize(notification, new JsonSerializerOptions { WriteIndented = true }));

                // W produkcji mozesz wyslac alert do webhook'u
                await SendAlertAsync(notification);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"?? Error notifying about triggered token: {ex.Message}");
            }
        }

        private async Task SendAlertAsync(object notification)
        {
            try
            {
                using (var client = _httpClientFactory.CreateClient())
                {
                    // Opcjonalnie: wyslij do wlasnego webhook'u
                    var webhookUrl = _configuration["CanaryTokensSettings:AlertWebhookUrl"];
                    if (!string.IsNullOrEmpty(webhookUrl))
                    {
                        var content = new StringContent(
                            JsonSerializer.Serialize(notification),
                            System.Text.Encoding.UTF8,
                            "application/json"
                        );

                        await client.PostAsync(webhookUrl, content);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"?? Could not send alert: {ex.Message}");
            }
        }
    }
}
