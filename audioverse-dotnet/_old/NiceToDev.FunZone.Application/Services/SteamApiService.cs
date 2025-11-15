using Microsoft.Extensions.Configuration;
using NiceToDev.FunZone.Application.Interfaces;
using NiceToDev.FunZone.Application.Models;
using System.Net.Http.Json;

namespace NiceToDev.FunZone.Application.Services
{
    public class SteamApiService : ISteamApiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public SteamApiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["SteamApiKey"] ?? throw new InvalidOperationException("Steam API key is not configured.");
        }

        /// <summary>
        /// Get a list of games owned by a Steam user.
        /// </summary>
        /// <param name="steamId">Steam Id (76561198273311125)</param>
        /// <returns>List of games</returns>
        public async Task<List<SteamGame>> GetOwnedGamesAsync(string steamId)
        {
            var url = $"https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
            var queryParams = new Dictionary<string, string>
        {
            { "key", _apiKey },
            { "steamid", steamId },
            { "include_appinfo", "true" },
            { "include_played_free_games", "true" }
        };

            var response = await _httpClient.GetFromJsonAsync<SteamApiResponse>($"{url}?{string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");

            return response?.Response.Games ?? new List<SteamGame>();
        }
    }
}
