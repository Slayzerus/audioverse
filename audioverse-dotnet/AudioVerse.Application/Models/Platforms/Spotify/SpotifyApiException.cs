using System.Net;

namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class SpotifyApiException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public string? ResponseBody { get; }
        public SpotifyApiException(string message, HttpStatusCode status, string? body = null, Exception? inner = null)
            : base(message, inner)
        {
            StatusCode = status;
            ResponseBody = body;
        }
    }
}
