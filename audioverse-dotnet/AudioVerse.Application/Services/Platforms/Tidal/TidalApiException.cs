using System.Net;

namespace AudioVerse.Application.Services.Platforms.Tidal
{
    public sealed class TidalApiException : Exception
    {
        public HttpStatusCode StatusCode { get; }
        public string? ResponseBody { get; }
        public TidalApiException(string message, HttpStatusCode status, string? body = null, Exception? inner = null)
            : base(message, inner)
        {
            StatusCode = status;
            ResponseBody = body;
        }
    }
}
