using System.Text.Json;
using System.Text;
using NiceToDev.FunZone.Application.Models.SpeechToText.OpenTTS;
using NiceToDev.FunZone.Application.Interfaces;

namespace NiceToDev.FunZone.Application.Services
{
    public class TextToSpeechService : ITextToSpeechService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:5500";

        public TextToSpeechService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        /// <summary>
        /// Pobiera listę dostępnych głosów w OpenTTS.
        /// </summary>
        public async Task<List<VoiceInfo>> GetVoicesAsync()
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/voices");

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Błąd pobierania głosów: {response.StatusCode}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var voicesDict = JsonSerializer.Deserialize<Dictionary<string, VoiceInfo>>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return voicesDict != null ? new List<VoiceInfo>(voicesDict.Values) : new List<VoiceInfo>();
        }

        /// <summary>
        /// Pobiera listę dostępnych języków w OpenTTS.
        /// </summary>
        public async Task<List<string>> GetLanguagesAsync()
        {
            var voices = await GetVoicesAsync();
            var languages = new HashSet<string>();

            foreach (var voice in voices)
            {
                languages.Add(voice.Language);
            }

            return new List<string>(languages);
        }

        public async Task<byte[]> TextToSpeechAsync(string text, string voice, string format = "wav")
        {
            // Tworzymy poprawny URL z parametrami query
            var requestUrl = $"{_baseUrl}/api/tts?text={Uri.EscapeDataString(text)}&voice={Uri.EscapeDataString(voice)}&format={format}";

            Console.WriteLine($"[DEBUG] Wysyłam request GET do OpenTTS: {requestUrl}");

            var response = await _httpClient.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode)
            {
                var errorMessage = await response.Content.ReadAsStringAsync();
                throw new Exception($"Błąd generowania mowy: {response.StatusCode} = {errorMessage}");
            }

            return await response.Content.ReadAsByteArrayAsync();
        }
    }
}
