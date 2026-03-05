namespace AudioVerse.Application.Exceptions;

/// <summary>
/// Exception thrown when validation fails.
/// Returns HTTP 422.
/// </summary>
public class ValidationException : ApiException
{
    /// <summary>
    /// Validation errors by field name.
    /// </summary>
    public IDictionary<string, string[]>? Errors { get; }

    public ValidationException(string message = "Validation failed") : base(message, 422) { }

    public ValidationException(IDictionary<string, string[]> errors) 
        : base("One or more validation errors occurred", 422)
    {
        Errors = errors;
    }

    public ValidationException(string field, string error) 
        : base($"Validation failed for '{field}': {error}", 422)
    {
        Errors = new Dictionary<string, string[]> { { field, new[] { error } } };
    }
}
