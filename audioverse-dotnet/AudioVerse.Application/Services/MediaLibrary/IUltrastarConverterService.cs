using System.Text;
using System.Text.RegularExpressions;

namespace AudioVerse.Application.Services.MediaLibrary
{
    public interface IUltrastarConverterService
    {
        Task<string?> ConvertLrcToUltrastarAsync(string artist, string title, string lrcContent, CancellationToken ct = default);
    }
}
