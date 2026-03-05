using MediatR;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetPermissionChangeHistoryQuery(int EventId, int? UserId = null, string? Action = null, DateTime? From = null, DateTime? To = null, int Page = 1, int PageSize = 50, string? SortBy = null, string? SortDir = null) : IRequest<AudioVerse.Application.Models.Common.PagedResult<AudioVerse.Application.Models.Admin.AuditLogAdminDto>>;
}
