using AudioVerse.Application.Services.MediaLibrary;

namespace AudioVerse.Application.Models.Karaoke
{
    public class UltrastarExportRequest
    {
        public UltrastarSongInfo Song { get; set; } = new();
        public string OutputPath { get; set; } = "";
    }
}

