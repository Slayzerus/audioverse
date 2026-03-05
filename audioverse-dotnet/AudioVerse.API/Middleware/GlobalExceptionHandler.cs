using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Middleware;

/// <summary>
/// Global exception handler returning RFC 7807 Problem Details responses.
/// Replaces per-controller try/catch blocks with a consistent error format.
/// </summary>
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (statusCode, title) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Invalid argument"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Resource not found"),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden, "Access denied"),
            InvalidOperationException => (HttpStatusCode.Conflict, "Invalid operation"),
            NotSupportedException => (HttpStatusCode.NotImplemented, "Not supported"),
            OperationCanceledException => (HttpStatusCode.ServiceUnavailable, "Request cancelled"),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred")
        };

        logger.LogError(exception, "Unhandled exception: {Message} (TraceId: {TraceId})",
            exception.Message, context.TraceIdentifier);

        var problem = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = statusCode == HttpStatusCode.InternalServerError ? null : exception.Message,
            Instance = context.Request.Path,
            Extensions = { ["traceId"] = context.TraceIdentifier }
        };

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem, ct);
        return true;
    }
}
