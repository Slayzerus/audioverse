using AudioVerse.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Middleware
{
    /// <summary>
    /// Middleware that checks if the authenticated user is banned.
    /// Banned users receive a 403 Forbidden response.
    /// </summary>
    /// <remarks>
    /// Supports both permanent bans (ExpiresAt = null) and temporary bans.
    /// Only active bans that haven't expired are enforced.
    /// </remarks>
    public class UserBanMiddleware
    {
        private readonly RequestDelegate _next;

        public UserBanMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        /// <summary>
        /// Checks if the user has an active ban before processing the request.
        /// </summary>
        /// <param name="context">The HTTP context</param>
        public async Task InvokeAsync(HttpContext context)
        {
            var userIdClaim = context.User?.FindFirst("id")?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                var db = context.RequestServices.GetRequiredService<AudioVerseDbContext>();
                var now = DateTime.UtcNow;
                
                // Check for active bans (permanent or not yet expired)
                var banned = await db.UserBans
                    .AnyAsync(b => b.UserId == userId && b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > now));

                if (banned)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"error\":\"Your account has been banned.\"}");
                    return;
                }
            }

            await _next(context);
        }
    }
}
