namespace AudioVerse.API.Middleware;

/// <summary>
/// Reads the api-version header (or query parameter) and exposes it via HttpContext.Items.
/// Prepares for future Asp.Versioning.Http migration.
/// Currently accepts: "1.0" (default), "2.0" (preview).
/// </summary>
public class ApiVersionMiddleware
{
    private readonly RequestDelegate _next;
    private const string DefaultVersion = "1.0";

    public ApiVersionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var version = context.Request.Headers["api-version"].FirstOrDefault()
                      ?? context.Request.Query["api-version"].FirstOrDefault()
                      ?? DefaultVersion;

        context.Items["ApiVersion"] = version;
        context.Response.Headers["api-version"] = version;

        await _next(context);
    }
}
