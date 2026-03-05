using System.Text;
using System.Text.RegularExpressions;
using AudioVerse.Application.Services.MediaLibrary;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Application.Services.Karaoke
{
    public class UltrastarConverterService : IUltrastarConverterService
    {
        private readonly ILogger<UltrastarConverterService> _logger;
        private readonly string _outputFolder = "ConvertedUltraStar";

        public UltrastarConverterService(ILogger<UltrastarConverterService> logger)
        {
            _logger = logger;
            Directory.CreateDirectory(_outputFolder);
        }

        public Task<string?> ConvertLrcToUltrastarAsync(string artist, string title, string lrcContent, CancellationToken ct)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine($"#TITLE:{title}");
                sb.AppendLine($"#ARTIST:{artist}");
                sb.AppendLine("#BPM:120");
                sb.AppendLine("#GAP:0");

                foreach (var line in lrcContent.Split('\n'))
                {
                    if (!line.StartsWith('[')) continue;
                    var match = Regex.Match(line, @"\[(\d+):(\d+(?:\.\d+)?)\](.+)");
                    if (!match.Success) continue;

                    int minutes = int.Parse(match.Groups[1].Value);
                    float seconds = float.Parse(match.Groups[2].Value, System.Globalization.CultureInfo.InvariantCulture);
                    string text = match.Groups[3].Value.Trim();
                    int timeMs = (int)((minutes * 60 + seconds) * 1000);
                    int beat = timeMs / 20;

                    sb.AppendLine($": {beat} 10 60 {text}");
                }

                sb.AppendLine("E");

                var filePath = Path.Combine(_outputFolder, $"{artist} - {title}.txt");
                File.WriteAllText(filePath, sb.ToString());
                return Task.FromResult<string?>(filePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LRC?UltraStar conversion failed for {Artist} - {Title}", artist, title);
                return Task.FromResult<string?>(null);
            }
        }
    }
}
