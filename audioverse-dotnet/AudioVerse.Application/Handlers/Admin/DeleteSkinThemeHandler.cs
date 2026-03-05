using System.Text.Json;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class DeleteSkinThemeHandler : IRequestHandler<DeleteSkinThemeCommand, bool>
    {
        private readonly ISkinThemeRepository _repo;
        private readonly IAuditRepository _audit;

        public DeleteSkinThemeHandler(ISkinThemeRepository repo, IAuditRepository audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<bool> Handle(DeleteSkinThemeCommand request, CancellationToken ct)
        {
            var theme = await _repo.GetByIdAsync(request.Id);
            if (theme == null) return false;

            bool result;
            if (theme.IsSystem)
            {
                result = await _repo.SoftDeleteAsync(request.Id);
            }
            else
            {
                result = await _repo.HardDeleteAsync(request.Id);
            }

            if (result)
            {
                await _audit.CreateLogAsync(new AuditLog
                {
                    UserId = request.UserId,
                    Username = request.Username ?? "system",
                    Action = "DeleteSkinTheme",
                    Description = $"Deleted skin theme '{theme.Name}' (Id={request.Id}, IsSystem={theme.IsSystem}, soft={theme.IsSystem})",
                    DetailsJson = JsonSerializer.Serialize(new { request.Id, theme.Name, theme.IsSystem }),
                    Success = true,
                    Timestamp = DateTime.UtcNow
                });
            }

            return result;
        }
    }
}
