using System.Text.Json;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class CreateSkinThemeHandler : IRequestHandler<CreateSkinThemeCommand, int>
    {
        private readonly ISkinThemeRepository _repo;
        private readonly IAuditRepository _audit;

        public CreateSkinThemeHandler(ISkinThemeRepository repo, IAuditRepository audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<int> Handle(CreateSkinThemeCommand request, CancellationToken ct)
        {
            var theme = new SkinTheme
            {
                Name = request.Name,
                Emoji = request.Emoji,
                Description = request.Description,
                IsDark = request.IsDark,
                BodyBackground = request.BodyBackground,
                Vars = JsonSerializer.Serialize(request.Vars),
                IsActive = request.IsActive,
                IsSystem = request.IsSystem,
                SortOrder = request.SortOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var id = await _repo.CreateAsync(theme);

            await _audit.CreateLogAsync(new AuditLog
            {
                UserId = request.UserId,
                Username = request.Username ?? "system",
                Action = "CreateSkinTheme",
                Description = $"Created skin theme '{request.Name}' (Id={id})",
                DetailsJson = JsonSerializer.Serialize(new { id, request.Name, request.Emoji, request.IsDark }),
                Success = true,
                Timestamp = DateTime.UtcNow
            });

            return id;
        }
    }
}
