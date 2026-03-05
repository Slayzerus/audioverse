using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Services.User;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class RevokePermissionHandler : IRequestHandler<RevokePermissionCommand, bool>
    {
        private readonly IKaraokeRepository _repo;
        private readonly IAuditLogService _audit;

        public RevokePermissionHandler(IKaraokeRepository repo, IAuditLogService audit)
        {
            _repo = repo;
            _audit = audit;
        }

        public async Task<bool> Handle(RevokePermissionCommand request, CancellationToken cancellationToken)
        {
            var pp = await _repo.GetKaraokePlayerAsync(request.EventId, request.PlayerId);
            if (pp == null) return false;

            var newPerm = pp.Permissions & ~request.Permission;
            var ok = await _repo.UpdateEventPlayerPermissionsAsync(request.EventId, request.PlayerId, newPerm);
            if (ok)
            {
                var details = new { PlayerId = request.PlayerId, Old = (int)pp.Permissions, New = (int)newPerm };
                await _audit.LogActionAsync(request.RevokedByUserId, null, "RevokePermission", $"Event={request.EventId}, Player={request.PlayerId}, Permission={(int)request.Permission}", true, detailsJson: System.Text.Json.JsonSerializer.Serialize(details));
            }
            return ok;
        }
    }
}
