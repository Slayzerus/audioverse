namespace AudioVerse.API.Middleware;

/// <summary>
/// Extension method for registering SessionTimeoutMiddleware.
/// </summary>
public static class SessionTimeoutMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionTimeout(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SessionTimeoutMiddleware>();
    }
}
