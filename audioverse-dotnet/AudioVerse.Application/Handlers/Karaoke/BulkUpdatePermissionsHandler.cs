using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Models.Requests.Karaoke;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class BulkUpdatePermissionsHandler : IRequestHandler<BulkUpdatePermissionsCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        private readonly AudioVerse.Application.Services.User.IAuditLogService _audit;

        public BulkUpdatePermissionsHandler(IKaraokeRepository repo, AudioVerse.Application.Services.User.IAuditLogService audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<bool> Handle(BulkUpdatePermissionsCommand request, CancellationToken cancellationToken)
        {
            var anyOk = false;
            var changes = new List<object>();
            foreach (var u in request.Updates)
            {
                var pp = await _repo.GetKaraokePlayerAsync(request.EventId, u.PlayerId);
                if (pp == null) continue;
                var newPerm = pp.Permissions | u.Permission;
                var ok = await _repo.UpdateEventPlayerPermissionsAsync(request.EventId, u.PlayerId, newPerm);
                if (ok)
                {
                    anyOk = true;
                    changes.Add(new { PlayerId = u.PlayerId, Old = (int)pp.Permissions, New = (int)newPerm });
                }
            }

            if (anyOk)
            {
                await _audit.LogActionAsync(request.ChangedByUserId, null, "BulkUpdatePermissions", $"Event={request.EventId}, Count={changes.Count}", true, detailsJson: System.Text.Json.JsonSerializer.Serialize(changes));
            }

            return anyOk;
        }
    }
}
