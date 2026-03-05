using System.Text.Json;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class UpdateSkinThemeHandler : IRequestHandler<UpdateSkinThemeCommand, bool>
    {
        private readonly ISkinThemeRepository _repo;
        private readonly IAuditRepository _audit;

        public UpdateSkinThemeHandler(ISkinThemeRepository repo, IAuditRepository audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<bool> Handle(UpdateSkinThemeCommand request, CancellationToken ct)
        {
            var theme = new SkinTheme
            {
                Id = request.Id,
                Name = request.Name,
                Emoji = request.Emoji,
                Description = request.Description,
                IsDark = request.IsDark,
                BodyBackground = request.BodyBackground,
                Vars = JsonSerializer.Serialize(request.Vars),
                IsActive = request.IsActive,
                SortOrder = request.SortOrder,
            };

            var result = await _repo.UpdateAsync(theme);

            if (result)
            {
                await _audit.CreateLogAsync(new AuditLog
                {
                    UserId = request.UserId,
                    Username = request.Username ?? "system",
                    Action = "UpdateSkinTheme",
                    Description = $"Updated skin theme '{request.Name}' (Id={request.Id})",
                    DetailsJson = JsonSerializer.Serialize(new { request.Id, request.Name, request.Emoji, request.IsDark }),
                    Success = true,
                    Timestamp = DateTime.UtcNow
                });
            }

            return result;
        }
    }
}
