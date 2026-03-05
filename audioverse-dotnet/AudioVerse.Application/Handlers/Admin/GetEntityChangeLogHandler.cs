using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin;

/// <summary>Handles retrieving entity change audit logs.</summary>
public class GetEntityChangeLogHandler(IAuditRepository audit) : IRequestHandler<GetEntityChangeLogQuery, IEnumerable<EntityChangeLog>>
{
    public async Task<IEnumerable<EntityChangeLog>> Handle(GetEntityChangeLogQuery req, CancellationToken ct)
    {
        return await audit.GetEntityChangeLogsAsync(req.EntityName, req.EntityId, req.Page, req.PageSize, ct);
    }
}
