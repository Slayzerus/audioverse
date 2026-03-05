using System.Text.Json;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class ActivateSkinThemeHandler : IRequestHandler<ActivateSkinThemeCommand, bool>
    {
        private readonly ISkinThemeRepository _repo;
        private readonly IAuditRepository _audit;

        public ActivateSkinThemeHandler(ISkinThemeRepository repo, IAuditRepository audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<bool> Handle(ActivateSkinThemeCommand request, CancellationToken ct)
        {
            if (!request.IsActive)
            {
                var activeCount = await _repo.CountActiveAsync();
                if (activeCount <= 1)
                    throw new InvalidOperationException("Cannot deactivate: at least one skin theme must remain active.");
            }

            var result = await _repo.ActivateAsync(request.Id, request.IsActive);

            if (result)
            {
                await _audit.CreateLogAsync(new AuditLog
                {
                    UserId = request.UserId,
                    Username = request.Username ?? "system",
                    Action = request.IsActive ? "ActivateSkinTheme" : "DeactivateSkinTheme",
                    Description = $"{(request.IsActive ? "Activated" : "Deactivated")} skin theme Id={request.Id}",
                    DetailsJson = JsonSerializer.Serialize(new { request.Id, request.IsActive }),
                    Success = true,
                    Timestamp = DateTime.UtcNow
                });
            }

            return result;
        }
    }
}
