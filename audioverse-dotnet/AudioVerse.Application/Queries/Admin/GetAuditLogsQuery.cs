using MediatR;
using AudioVerse.Application.Models.Admin;
using System.Collections.Generic;

namespace AudioVerse.Application.Queries.Admin
{
    public record GetAuditLogsQuery(int Take = 100) : IRequest<List<AuditLogAdminDto>>;
}
