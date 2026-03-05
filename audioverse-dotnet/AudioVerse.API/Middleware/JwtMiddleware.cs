using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace AudioVerse.API.Middleware
{
    /// <summary>
    /// JWT authentication middleware that validates Bearer tokens and attaches
    /// the authenticated user principal to HttpContext.User.
    /// </summary>
    /// <remarks>
    /// This middleware runs before authorization and extracts claims from valid JWT tokens.
    /// Invalid or expired tokens are silently ignored (anonymous access).
    /// </remarks>
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _jwtSecret;

        public JwtMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _jwtSecret = configuration["JwtSettings:Secret"] ?? "super-secret-key-for-jwt-authentication";
        }

        /// <summary>
        /// Processes the HTTP request, extracting and validating JWT token if present.
        /// </summary>
        /// <param name="context">The HTTP context for the current request</param>
        public async Task Invoke(HttpContext context)
        {
            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

            if (string.IsNullOrWhiteSpace(token) && context.Request.Path.StartsWithSegments("/hubs"))
            {
                token = context.Request.Query["access_token"].FirstOrDefault();
            }

            if (token != null) AttachUserToContext(context, token);

            await _next(context);
        }

        /// <summary>
        /// Validates the JWT token and attaches the user principal to the context.
        /// </summary>
        /// <param name="context">The HTTP context</param>
        /// <param name="token">The JWT token string</param>
        private void AttachUserToContext(HttpContext context, string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSecret);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
                context.User = principal;
            }
            catch (SecurityTokenException)
            {
                // Token validation failed - continue as anonymous request
            }
        }
    }
}
