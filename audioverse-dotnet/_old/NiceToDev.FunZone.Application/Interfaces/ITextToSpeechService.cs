using NiceToDev.FunZone.Application.Models.SpeechToText.OpenTTS;

namespace NiceToDev.FunZone.Application.Interfaces
{
    public interface ITextToSpeechService
    {
        Task<List<string>> GetLanguagesAsync();
        Task<List<VoiceInfo>> GetVoicesAsync();
        Task<byte[]> TextToSpeechAsync(string text, string voice, string format = "wav");
    }

}
