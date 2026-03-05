namespace AudioVerse.Application.Services.MediaLibrary
{
    public class UltrastarFileOptions
    {
        public string RootDirectory { get; set; } = "Karaoke";
        public string[] AdditionalRootDirectories { get; set; } = Array.Empty<string>();
        public string IndexFileName { get; set; } = ".ultrastar_index.json";
    }
}
