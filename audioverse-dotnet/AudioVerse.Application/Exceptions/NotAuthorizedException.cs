namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Exception thrown when user lacks permission to perform an action.
/// Returns HTTP 403.
/// </summary>
public class NotAuthorizedException : ApiException
{
    public NotAuthorizedException(string message = "Not authorized") : base(message, 403) { }

    public NotAuthorizedException(string action, string resource) 
        : base($"You are not authorized to {action} this {resource}", 403) { }
}
