using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Helper for generating JWT tokens used in integration tests.
    /// </summary>
    public static class JwtTokenHelper
    {
        private const string JwtSecret = "integration-test-secret-key-1234567890";

        /// <summary>
        /// Generates a bearer token for a non-admin user with id and username.
        /// </summary>
        public static string GenerateToken(string userId, string username)
        {
            var handler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(JwtSecret);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", userId),
                    new Claim("username", username)
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = handler.CreateToken(descriptor);
            return handler.WriteToken(token);
        }

        /// <summary>
        /// Convenience: token for seeded test user (id = 1)
        /// </summary>
        public static string GenerateTokenForTestUser()
        {
            // seeded test player/profile uses ProfileId = 2 in TestDataSeeder
            return GenerateToken("2", "testuser");
        }

        /// <summary>
        /// Convenience: token for another test user (id = 3)
        /// </summary>
        public static string GenerateTokenForAnotherUser()
        {
            return GenerateToken("3", "otheruser");
        }

        /// <summary>
        /// Generates a bearer token with Admin role.
        /// </summary>
        public static string GenerateAdminToken()
        {
            var handler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(JwtSecret);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", "1"),
                    new Claim("username", "admin"),
                    new Claim(ClaimTypes.Role, "Admin")
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = handler.CreateToken(descriptor);
            return handler.WriteToken(token);
        }
    }
}
