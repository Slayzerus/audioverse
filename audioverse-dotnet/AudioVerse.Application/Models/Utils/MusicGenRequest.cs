namespace AudioVerse.Application.Models.Utils
{
    public class MusicGenRequest
    {
        public string Prompt { get; set; } = "";
        public int? DurationSec { get; set; }
    }
}

