using Microsoft.AspNetCore.WebUtilities;
using System.Security.Cryptography;
using System.Text;

namespace AudioVerse.Application.Models.Audio
{
    public static class SongId
    {
        public static string FromPath(string path)
        {
            // stabilny, URL-safe identyfikator z pełnej ścieżki
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(path));
            return WebEncoders.Base64UrlEncode(hash); // bez '=' i bez '/'
        }
    }
}
