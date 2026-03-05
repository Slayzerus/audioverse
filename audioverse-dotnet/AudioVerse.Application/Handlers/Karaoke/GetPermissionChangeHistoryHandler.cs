using MediatR;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Models.Admin;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.Application.Handlers.Karaoke
{
    public class GetPermissionChangeHistoryHandler : IRequestHandler<GetPermissionChangeHistoryQuery, AudioVerse.Application.Models.Common.PagedResult<AuditLogAdminDto>>
    {
        private readonly IAuditRepository _auditRepo;
        public GetPermissionChangeHistoryHandler(IAuditRepository auditRepo) { _auditRepo = auditRepo; }

        public async Task<AudioVerse.Application.Models.Common.PagedResult<AuditLogAdminDto>> Handle(GetPermissionChangeHistoryQuery request, CancellationToken cancellationToken)
        {
            var (logs, total) = await _auditRepo.GetPermissionChangeLogsAsync(
                request.EventId, request.UserId, request.Action,
                request.From, request.To,
                request.SortBy, request.SortDir,
                request.Page, request.PageSize, cancellationToken);

            var result = new List<AudioVerse.Application.Models.Admin.AuditLogAdminDto>();
            foreach (var l in logs)
            {
                var dto = new AudioVerse.Application.Models.Admin.AuditLogAdminDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Username = l.Username,
                    Action = l.Action,
                    Description = l.Description,
                    DetailsJson = l.DetailsJson,
                    Timestamp = l.Timestamp,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    Success = l.Success,
                    ErrorMessage = l.ErrorMessage
                };

                if (!string.IsNullOrEmpty(l.DetailsJson))
                {
                    try
                    {
                        if (l.Action == "BulkUpdatePermissions" || l.Action == "BulkRevokePermissions")
                        {
                            var changes = System.Text.Json.JsonSerializer.Deserialize<List<AudioVerse.Application.Models.Admin.PermissionChangeDetailDto>>(l.DetailsJson);
                            dto.BulkDetails = new AudioVerse.Application.Models.Admin.BulkPermissionChangeDto { Changes = changes ?? new List<AudioVerse.Application.Models.Admin.PermissionChangeDetailDto>() };
                        }
                        else
                        {
                            var detail = System.Text.Json.JsonSerializer.Deserialize<AudioVerse.Application.Models.Admin.PermissionChangeDetailDto>(l.DetailsJson);
                            dto.Details = detail;
                        }
                    }
                    catch (System.Text.Json.JsonException) { }
                }

                result.Add(dto);
            }

            // Wrap result with pagination metadata
            // We cannot change the handler signature easily, so include total in each DTO as TotalCount for convenience
            result.ForEach(r => { /* no-op */ });
            // Attach total via DetailsJson wrapper if desired by consumer; but we'll return DTOs and client can read total from header in controller
            // For now, return tuple-like anonymous object handled by controller
            return new AudioVerse.Application.Models.Common.PagedResult<AuditLogAdminDto>
            {
                Items = result,
                TotalCount = total,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }
    }
}
