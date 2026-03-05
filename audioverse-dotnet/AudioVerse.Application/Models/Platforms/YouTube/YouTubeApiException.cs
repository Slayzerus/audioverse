using System.Net;

namespace AudioVerse.Application.Models.Platforms.YouTube
{
    public sealed class YouTubeApiException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public string? ResponseBody { get; }
        public YouTubeApiException(string message, HttpStatusCode status, string? body = null, Exception? inner = null) : base(message, inner)
        {
            StatusCode = status;
            ResponseBody = body;
        }
    }
}
