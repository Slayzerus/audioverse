using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace AudioVerse.API.Middleware
{
    /// <summary>
    /// Middleware that monitors user inactivity and logs out after a specified period.
    /// Uses JWT claims instead of sessions (stateless).
    /// </summary>
    /// <remarks>
    /// Default inactivity timeout is 30 minutes, based on JWT 'iat' (issued at) claim.
    /// Returns 401 Unauthorized with SESSION_EXPIRED code when timeout is exceeded.
    /// </remarks>
    public class SessionTimeoutMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionTimeoutMiddleware> _logger;
        
        /// <summary>
        /// Session inactivity timeout in minutes.
        /// </summary>
        private const int InactivityTimeoutMinutes = 30;

        public SessionTimeoutMiddleware(RequestDelegate next, ILogger<SessionTimeoutMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// Checks if the user session has exceeded the inactivity timeout.
        /// </summary>
        /// <param name="context">The HTTP context</param>
        /// <param name="dbContext">Database context</param>
        /// <param name="userManager">User manager for identity operations</param>
        public async Task InvokeAsync(HttpContext context, AudioVerseDbContext dbContext, UserManager<UserProfile> userManager)
        {
            try
            {
                // Get userId and iat (issued at) from JWT claims
                var userIdClaim = context.User.FindFirst("id")?.Value;
                var iatClaim = context.User.FindFirst("iat")?.Value;
                var usernameClaim = context.User.FindFirst("username")?.Value;
                
                if (!string.IsNullOrEmpty(userIdClaim) && !string.IsNullOrEmpty(iatClaim) && 
                    int.TryParse(userIdClaim, out var userId) &&
                    long.TryParse(iatClaim, out var iatUnixTime))
                {
                    // Convert Unix timestamp to DateTime
                    var tokenIssuedAt = UnixTimeStampToDateTime(iatUnixTime);
                    var now = DateTime.UtcNow;
                    var sessionDuration = now - tokenIssuedAt;

                    // Check if inactivity timeout exceeded
                    if (sessionDuration.TotalMinutes > InactivityTimeoutMinutes)
                    {
                        _logger.LogWarning("User {Username} (ID: {UserId}) session expired due to inactivity ({Duration:F0} minutes)", 
                            usernameClaim, userId, sessionDuration.TotalMinutes);

                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new 
                        { 
                            success = false,
                            message = $"Session expired due to inactivity ({InactivityTimeoutMinutes} minutes)",
                            code = "SESSION_EXPIRED"
                        });
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SessionTimeoutMiddleware");
                // Don't disrupt normal flow on error
            }

            await _next(context);
        }

        /// <summary>
        /// Converts Unix timestamp (iat claim) to DateTime.
        /// </summary>
        /// <param name="unixTimeStamp">Unix timestamp in seconds</param>
        /// <returns>UTC DateTime</returns>
        private static DateTime UnixTimeStampToDateTime(long unixTimeStamp)
        {
            var dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(unixTimeStamp).ToUniversalTime();
            return dateTime;
        }
    }
}
