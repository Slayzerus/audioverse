using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Queries.Admin;

/// <summary>Get entity change audit log with filtering.</summary>
public record GetEntityChangeLogQuery(string? EntityName, string? EntityId, int Page = 1, int PageSize = 50) : IRequest<IEnumerable<EntityChangeLog>>;
