namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Base API exception with HTTP status code.
/// </summary>
public class ApiException : Exception
{
    /// <summary>
    /// HTTP status code to return.
    /// </summary>
    public int StatusCode { get; }

    public ApiException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}
