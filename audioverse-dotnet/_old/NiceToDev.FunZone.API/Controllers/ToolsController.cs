using Microsoft.AspNetCore.Mvc;
using NiceToDev.FunZone.Application.Interfaces;
using NiceToDev.FunZone.Application.Models.SpeechToText.OpenTTS;

namespace NiceToDev.FunZone.API.Controllers
{
    [ApiController]
    [Route("api/tools")]
    public class ToolsController : ControllerBase
    {
        private readonly ITextToSpeechService _textToSpeechService;

        public ToolsController(ITextToSpeechService textToSpeechService)
        {
            _textToSpeechService = textToSpeechService;
        }

        [HttpGet("languages")]
        public async Task<ActionResult<List<string>>> GetLanguages()
        {
            var languages = await _textToSpeechService.GetLanguagesAsync();
            return Ok(languages);
        }

        [HttpGet("voices")]
        public async Task<ActionResult<List<VoiceInfo>>> GetVoices()
        {
            var voices = await _textToSpeechService.GetVoicesAsync();
            return Ok(voices);
        }

        [HttpPost("tts")]
        public async Task<IActionResult> TextToSpeech([FromQuery] string text, [FromQuery] string voice, [FromQuery] string format = "wav")
        {
            var audioData = await _textToSpeechService.TextToSpeechAsync(text, voice, format);
            return File(audioData, "audio/wav", "speech.wav");
        }
    }
}
