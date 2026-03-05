using MediatR;
using System.Collections.Generic;
using AudioVerse.Application.Models.Requests.Karaoke;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record BulkUpdatePermissionsCommand(int EventId, IEnumerable<BulkPermissionUpdate> Updates, int ChangedByUserId) : IRequest<bool>;
}
