namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Exception thrown when a conflict occurs (e.g., duplicate resource).
/// Returns HTTP 409.
/// </summary>
public class ConflictException : ApiException
{
    public ConflictException(string message = "Conflict") : base(message, 409) { }

    public ConflictException(string entityName, string conflictReason) 
        : base($"{entityName} conflict: {conflictReason}", 409) { }
}
