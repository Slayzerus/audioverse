using System.Net;
using System.Text.Json;
using Serilog;

namespace AudioVerse.API.Middleware
{
    /// <summary>
    /// Global exception handling middleware that catches unhandled exceptions,
    /// logs them, and returns a standardized JSON error response.
    /// </summary>
    /// <remarks>
    /// Supports custom ApiException types with specific HTTP status codes.
    /// All other exceptions result in a 500 Internal Server Error.
    /// </remarks>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        /// <summary>
        /// Processes the HTTP request and catches any unhandled exceptions.
        /// </summary>
        /// <param name="context">The HTTP context for the current request</param>
        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        /// <summary>
        /// Handles the exception by logging it and writing a JSON error response.
        /// </summary>
        /// <param name="context">The HTTP context</param>
        /// <param name="exception">The caught exception</param>
        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            int status = (int)HttpStatusCode.InternalServerError;
            string message = "An internal server error occurred";

            // Handle custom API exceptions with specific status codes
            if (exception is AudioVerse.Application.Exceptions.ApiException apiEx)
            {
                status = apiEx.StatusCode;
                message = apiEx.Message;
            }

            var response = new { StatusCode = status, Message = message };
            Log.Error(exception, "Unhandled exception: {Message}", exception.Message);
            
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = status;
            return context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
