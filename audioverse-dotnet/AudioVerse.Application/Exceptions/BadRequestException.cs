namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Exception thrown when a request is malformed or invalid.
/// Returns HTTP 400.
/// </summary>
public class BadRequestException : ApiException
{
    public BadRequestException(string message = "Bad request") : base(message, 400) { }

    public BadRequestException(string field, string reason) 
        : base($"Invalid value for '{field}': {reason}", 400) { }
}
