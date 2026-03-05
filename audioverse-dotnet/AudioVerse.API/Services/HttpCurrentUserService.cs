using AudioVerse.Application.Services;
using System.Security.Claims;

namespace AudioVerse.API.Services
{
    public class HttpCurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _contextAccessor;

        public HttpCurrentUserService(IHttpContextAccessor contextAccessor)
        {
            _contextAccessor = contextAccessor;
        }

        public int? UserId
        {
            get
            {
                var idClaim = _contextAccessor.HttpContext?.User?.FindFirst("id")?.Value;
                if (int.TryParse(idClaim, out var id)) return id;
                return null;
            }
        }

        public bool IsAdmin
        {
            get
            {
                var roles = _contextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();
                return roles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase));
            }
        }
    }
}
