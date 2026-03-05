namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Exception thrown when a requested resource is not found.
/// Returns HTTP 404.
/// </summary>
public class NotFoundException : ApiException
{
    public NotFoundException(string message = "Not found") : base(message, 404) { }

    public NotFoundException(string entityName, object id) 
        : base($"{entityName} with id '{id}' was not found", 404) { }
}
